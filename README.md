# Book Reading Log

A private reading log: sign in with Google or an email and password, then keep a
shelf of books with a status, a rating and a note. Every book belongs to the
signed-in user and nobody else can see it.

- **Frontend** — Vite + React, Firebase Auth in the browser.
- **Backend** — Express under `/api`. It holds the Turso credentials, verifies
  the caller's Firebase ID token on every request, and filters every query by
  the uid taken from that token.
- **Database** — Turso (libSQL), one `books` table with a `user_id` column.

## Setup

1. `npm install`
2. Fill in `.env` (it already has the right variable names — see `.env.example`):

   | Variable | Where it comes from |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase console → Project settings → Your apps → Web app config |
   | `TURSO_DATABASE_URL` | `turso db show <database> --url` |
   | `TURSO_AUTH_TOKEN` | `turso db tokens create <database>` |

   `VITE_FIREBASE_PROJECT_ID` is stored **once**: the browser needs it to talk to
   Firebase, and the backend verifies ID tokens against that same value, so the
   two can never drift apart.

   The Turso variables have no `VITE_` prefix, which is what keeps them out of
   the browser bundle — Vite only exposes `VITE_`-prefixed variables to client
   code. `.env` is gitignored; `.env.example` is the committed copy.

3. In the Firebase console, enable **Google** and **Email/Password** under
   Authentication → Sign-in method, and add your domain (including
   `localhost` for development) under Authentication → Settings →
   Authorized domains.

The `books` table is created automatically on first use — no migration step.

## Running locally

Two terminals:

```bash
npm run server
```

```bash
npm run dev
```

The API listens on <http://localhost:3001/api> and the app on
<http://localhost:5173>. The Vite dev server proxies `/api` to the backend, so
the frontend only ever calls relative `/api/...` URLs.

## Deploying to Vercel

The frontend and backend deploy as **one** Vercel project:

- `vercel.json` builds the Vite app into `dist/` and rewrites `/api/*` to the
  serverless function in `api/index.js`, which serves the same Express app used
  locally.
- Add every variable from `.env` to the Vercel project's environment variables
  (Settings → Environment Variables). There is no `.env` file in production.
- Add the deployed domain to Firebase's authorized domains, or Google sign-in
  will be refused there.

## How a request is authorised

1. The browser signs in with Firebase and gets an ID token.
2. `src/lib/api.js` sends it as `Authorization: Bearer <token>`. It never sends
   a user id — there would be no reason to trust one.
3. `server/auth.js` verifies the token's signature against Google's public keys,
   plus its issuer and audience (your Firebase project), and puts the uid on
   `req.user`.
4. Every query in `server/books.js` filters on that uid. An update or delete for
   a row owned by someone else matches nothing and returns 404 — the same answer
   as a row that does not exist, so the API cannot be used to probe for other
   people's ids.

Every refusal passes through `server/refuse.js`, which writes the exact reason to
the server log (`[refused] 401 GET /api/books uid=<unauthenticated> reason=ID
token rejected: ERR_JWT_EXPIRED …`) while the browser gets a short, friendly
message.

## Layout

```
api/index.js        Vercel entry point — exports the Express app
server/
  index.js          local entry point (npm run server)
  app.js            Express app, mounted at /api
  auth.js           Firebase ID token verification
  books.js          the /api/books routes
  db.js             Turso client + schema
  env.js            reads .env, fails loudly when something is missing
  refuse.js         one place that logs every refusal
  validate.js       payload validation, with a reason for each rejection
src/
  App.jsx           signed out -> LoginPage, signed in -> Shelf
  components/       LoginPage, Shelf, Stats, BookForm, BookList
  lib/              firebase config, API client, status vocabulary
```
