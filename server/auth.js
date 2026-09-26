import { createRemoteJWKSet, jwtVerify } from 'jose'
import { firebaseProjectId } from './env.js'
import { refuse } from './refuse.js'

// Google's public keys for Firebase ID tokens. createRemoteJWKSet caches them
// and refetches only on key rotation, so this costs one HTTP call per cache
// lifetime rather than one per request. Verifying against these public keys
// needs no service account — only the project id, which we already have.
// Note the path: /service_accounts/v1/jwk/ (singular). The plural spelling
// returns 404, which shows up as a key-set fetch failure on every request.
const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
)

const issuer = `https://securetoken.google.com/${firebaseProjectId}`

/**
 * Verifies the caller's Firebase ID token before any data is touched and puts
 * the trusted identity on req.user. Nothing downstream may take a user id from
 * the request body, query or headers — only from here.
 */
export async function requireUser(req, res, next) {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')

  if (!header) {
    return refuse(req, res, 401, 'no Authorization header', 'Please sign in.')
  }
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return refuse(
      req,
      res,
      401,
      `malformed Authorization header (expected "Bearer <token>", got "${scheme}")`,
      'Please sign in.',
    )
  }

  let payload
  try {
    ;({ payload } = await jwtVerify(token, JWKS, {
      algorithms: ['RS256'],
      issuer,
      audience: firebaseProjectId,
    }))
  } catch (err) {
    // A key-set fetch failure is our problem, not the caller's: their token may
    // be perfectly good. Saying "sign in again" there sends them round a loop
    // that cannot succeed, so it is reported as a server fault instead.
    // Only a failure to RETRIEVE the key set counts. ERR_JWKS_NO_MATCHING_KEY is
    // the opposite: the keys were fetched fine and the token matched none of
    // them, which means the token is not from Google — a 401, not a 503.
    const keyFetchFailed =
      err.code === 'ERR_JWKS_TIMEOUT' ||
      (err.code === 'ERR_JOSE_GENERIC' && /JSON Web Key Set/i.test(err.message ?? ''))
    if (keyFetchFailed) {
      return refuse(
        req,
        res,
        503,
        `could not fetch Google's signing keys: ${err.code ?? err.name} ${err.message}`,
        'Cannot verify sign-in right now. Please try again in a moment.',
      )
    }

    // err.code / err.message carry the precise failure: expired, bad signature,
    // wrong audience (a token from another Firebase project), and so on.
    return refuse(
      req,
      res,
      401,
      `ID token rejected: ${err.code ?? err.name} ${err.message}`,
      'Your session has expired. Please sign in again.',
    )
  }

  // Firebase guarantees a non-empty `sub` (the uid) and an `auth_time` no later
  // than now; a token failing either is not one to trust.
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    return refuse(req, res, 401, 'ID token has no subject (uid)', 'Please sign in.')
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > Date.now() / 1000 + 60) {
    return refuse(
      req,
      res,
      401,
      `ID token auth_time is in the future (${payload.auth_time})`,
      'Please sign in.',
    )
  }

  req.user = {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
  }
  return next()
}
