const MAX_TITLE = 200
const MAX_AUTHOR = 120
const MAX_NOTE = 1000

export const STATUSES = ['reading', 'finished', 'want_to_read']

// Each validator returns either { value } or { reason }, so a caller can log the
// exact reason a request was refused rather than a generic "bad request".

function text(raw, label, max) {
  if (typeof raw !== 'string') {
    return { reason: `${label} is not a string (got ${typeof raw})` }
  }
  const trimmed = raw.trim()
  if (!trimmed) return { reason: `${label} is empty` }
  if (trimmed.length > max) {
    return { reason: `${label} is longer than ${max} characters (got ${trimmed.length})` }
  }
  return { value: trimmed }
}

function status(raw) {
  if (typeof raw !== 'string') {
    return { reason: `status is not a string (got ${typeof raw})` }
  }
  if (!STATUSES.includes(raw)) {
    return { reason: `status is not one of ${STATUSES.join(', ')} (got ${JSON.stringify(raw)})` }
  }
  return { value: raw }
}

// A rating is optional: an empty string, null or undefined all mean "unrated",
// which is the normal state for a book you have not finished.
function rating(raw) {
  if (raw === undefined || raw === null || raw === '') return { value: null }
  const n = typeof raw === 'string' ? Number(raw.trim()) : raw
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    return { reason: `rating is not a whole number (got ${JSON.stringify(raw)})` }
  }
  if (n < 1 || n > 5) return { reason: `rating is outside 1-5 (got ${n})` }
  return { value: n }
}

function note(raw) {
  if (raw === undefined || raw === null) return { value: '' }
  if (typeof raw !== 'string') return { reason: `note is not a string (got ${typeof raw})` }
  if (raw.length > MAX_NOTE) {
    return { reason: `note is longer than ${MAX_NOTE} characters (got ${raw.length})` }
  }
  return { value: raw.trim() }
}

/** Validates a whole book payload. Returns { value } or { reason }. */
export function bookPayload(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { reason: `request body is not a JSON object (got ${typeof body})` }
  }
  const fields = {
    title: text(body.title, 'title', MAX_TITLE),
    author: text(body.author, 'author', MAX_AUTHOR),
    status: status(body.status),
    rating: rating(body.rating),
    note: note(body.note),
  }
  const failed = Object.values(fields).find((field) => field.reason)
  if (failed) return { reason: failed.reason }

  return {
    value: {
      title: fields.title.value,
      author: fields.author.value,
      status: fields.status.value,
      rating: fields.rating.value,
      note: fields.note.value,
    },
  }
}

/** The ?status= filter is optional; an empty filter means "all books". */
export function statusFilter(raw) {
  if (raw === undefined || raw === '') return { value: null }
  const checked = status(raw)
  return checked.reason ? { reason: `status filter invalid: ${checked.reason}` } : checked
}

/** Route params arrive as strings; ids must be positive integers. */
export function bookId(raw) {
  if (!/^\d+$/.test(raw ?? '')) {
    return { reason: `id is not a positive integer (got ${JSON.stringify(raw)})` }
  }
  const n = Number(raw)
  if (!Number.isSafeInteger(n) || n <= 0) {
    return { reason: `id is out of range (got ${raw})` }
  }
  return { value: n }
}
