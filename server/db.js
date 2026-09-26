import { createClient } from '@libsql/client'
import { tursoAuthToken, tursoUrl } from './env.js'

export const db = createClient({ url: tursoUrl, authToken: tursoAuthToken })

// user_id holds the Firebase uid from the verified token and is never optional:
// a row that no verified user owns cannot exist. Every query filters on it.
// rating is nullable — a book you have not read yet has no rating to give.
const schema = [
  `CREATE TABLE IF NOT EXISTS books (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id    TEXT    NOT NULL,
     title      TEXT    NOT NULL,
     author     TEXT    NOT NULL,
     status     TEXT    NOT NULL CHECK (status IN ('reading', 'finished', 'want_to_read')),
     rating     INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
     note       TEXT    NOT NULL DEFAULT '',
     created_at TEXT    NOT NULL DEFAULT (datetime('now')),
     updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
   )`,
  `CREATE INDEX IF NOT EXISTS idx_books_user_status
     ON books (user_id, status, id DESC)`,
]

// Memoized so the schema check costs one round trip per process, which matters
// on Vercel where each cold start is a fresh process.
let ready
export function ensureSchema() {
  ready ??= db.batch(schema, 'write').catch((err) => {
    ready = undefined // let the next request retry instead of caching the failure
    throw err
  })
  return ready
}
