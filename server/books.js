import { Router } from 'express'
import { requireUser } from './auth.js'
import { db, ensureSchema } from './db.js'
import { logError, refuse } from './refuse.js'
import { bookId, bookPayload, statusFilter } from './validate.js'

export const books = Router()

// Nothing below runs until the caller's ID token has been verified, so
// req.user.uid is always a trusted Firebase uid.
books.use(requireUser)

const COLUMNS = 'id, title, author, status, rating, note'

// Reading first, then the pile you mean to start, then what you have finished —
// the order a shelf is useful in. Titles break ties, case-insensitively.
const ORDER = `ORDER BY CASE status
                 WHEN 'reading' THEN 0
                 WHEN 'want_to_read' THEN 1
                 ELSE 2
               END, title COLLATE NOCASE, id DESC`

function toBook(row) {
  return {
    id: Number(row.id),
    title: row.title,
    author: row.author,
    status: row.status,
    rating: row.rating === null ? null : Number(row.rating),
    note: row.note ?? '',
  }
}

// Wraps a handler so a thrown error becomes one logged 500 rather than an
// unhandled rejection.
function handler(fn) {
  return async (req, res) => {
    try {
      await ensureSchema()
      await fn(req, res)
    } catch (err) {
      logError(req, err)
      res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }
  }
}

/**
 * Totals across the signed-in user's whole shelf, computed in SQL so they stay
 * the same no matter which filter the client is showing. The average covers
 * finished books that carry a rating; finished-but-unrated books are counted in
 * `finished` but cannot pull the average toward zero.
 */
async function readStats(uid) {
  const result = await db.execute({
    sql: `SELECT
            COUNT(*)                                                   AS total,
            SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END)       AS finished,
            AVG(CASE WHEN status = 'finished' THEN rating END)         AS average_rating,
            SUM(CASE WHEN status = 'finished' AND rating IS NOT NULL
                     THEN 1 ELSE 0 END)                                AS rated_finished
          FROM books WHERE user_id = ?`,
    args: [uid],
  })
  const row = result.rows[0] ?? {}
  const average = row.average_rating
  return {
    total: Number(row.total ?? 0),
    finished: Number(row.finished ?? 0),
    ratedFinished: Number(row.rated_finished ?? 0),
    // Rounded to one decimal for display; null when nothing finished is rated.
    averageRating: average === null || average === undefined ? null : Math.round(Number(average) * 10) / 10,
  }
}

/**
 * GET /books?status=reading
 * The signed-in user's own books — filtered when asked — plus whole-shelf stats.
 */
books.get(
  '/',
  handler(async (req, res) => {
    const { uid } = req.user
    const filter = statusFilter(req.query.status)
    if (filter.reason) return refuse(req, res, 400, filter.reason, 'Unknown filter.')

    const rows = filter.value
      ? await db.execute({
          sql: `SELECT ${COLUMNS} FROM books WHERE user_id = ? AND status = ? ${ORDER}`,
          args: [uid, filter.value],
        })
      : await db.execute({
          sql: `SELECT ${COLUMNS} FROM books WHERE user_id = ? ${ORDER}`,
          args: [uid],
        })

    res.json({ books: rows.rows.map(toBook), stats: await readStats(uid) })
  }),
)

/** POST /books — user_id comes from the verified token, never from the body. */
books.post(
  '/',
  handler(async (req, res) => {
    const { value, reason } = bookPayload(req.body)
    if (reason) return refuse(req, res, 400, reason)

    const result = await db.execute({
      sql: `INSERT INTO books (user_id, title, author, status, rating, note)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING ${COLUMNS}`,
      args: [req.user.uid, value.title, value.author, value.status, value.rating, value.note],
    })

    res.status(201).json({ book: toBook(result.rows[0]), stats: await readStats(req.user.uid) })
  }),
)

/** PUT /books/:id — the user_id predicate is what enforces ownership. */
books.put(
  '/:id',
  handler(async (req, res) => {
    const id = bookId(req.params.id)
    if (id.reason) return refuse(req, res, 400, id.reason)

    const { value, reason } = bookPayload(req.body)
    if (reason) return refuse(req, res, 400, reason)

    const result = await db.execute({
      sql: `UPDATE books
            SET title = ?, author = ?, status = ?, rating = ?, note = ?,
                updated_at = datetime('now')
            WHERE id = ? AND user_id = ?
            RETURNING ${COLUMNS}`,
      args: [
        value.title,
        value.author,
        value.status,
        value.rating,
        value.note,
        id.value,
        req.user.uid,
      ],
    })

    // No row matched: it does not exist, or it belongs to someone else. The
    // client is told the same thing either way, so the API cannot be used to
    // probe for other people's row ids. The log records which uid asked.
    if (result.rows.length === 0) {
      return refuse(
        req,
        res,
        404,
        `book id=${id.value} not found for uid=${req.user.uid} (missing or owned by another user)`,
        'That book is no longer on your shelf.',
      )
    }

    res.json({ book: toBook(result.rows[0]), stats: await readStats(req.user.uid) })
  }),
)

/** DELETE /books/:id — same ownership predicate. */
books.delete(
  '/:id',
  handler(async (req, res) => {
    const id = bookId(req.params.id)
    if (id.reason) return refuse(req, res, 400, id.reason)

    const result = await db.execute({
      sql: `DELETE FROM books WHERE id = ? AND user_id = ?`,
      args: [id.value, req.user.uid],
    })

    if (result.rowsAffected === 0) {
      return refuse(
        req,
        res,
        404,
        `book id=${id.value} not found for uid=${req.user.uid} (missing or owned by another user)`,
        'That book is no longer on your shelf.',
      )
    }

    res.json({ stats: await readStats(req.user.uid) })
  }),
)
