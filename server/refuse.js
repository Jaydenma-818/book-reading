// Every refusal goes through here, so a rejected request always leaves the
// exact reason in the server log. `reason` is the precise internal detail;
// `clientMessage` is what the browser is told — the two differ for auth
// failures, which stay vague to the caller and specific in the log.
export function refuse(req, res, status, reason, clientMessage = reason) {
  const who = req.user?.uid ? `uid=${req.user.uid}` : 'uid=<unauthenticated>'
  console.warn(`[refused] ${status} ${req.method} ${req.originalUrl} ${who} reason=${reason}`)
  return res.status(status).json({ error: clientMessage })
}

export function logError(req, err) {
  console.error(
    `[error] 500 ${req.method} ${req.originalUrl} ` +
      `uid=${req.user?.uid ?? '<unauthenticated>'} ${err?.stack ?? err}`,
  )
}
