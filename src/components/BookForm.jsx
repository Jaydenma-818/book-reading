import { useState } from 'react'
import { EMPTY_BOOK, STATUSES } from '../lib/books'

/**
 * One form for both adding and editing: `book` null means a new book. Rating is
 * deliberately optional — a book you have not read yet has nothing to rate.
 */
export default function BookForm({ book, onSave, onCancel }) {
  const [values, setValues] = useState(() =>
    book
      ? {
          title: book.title,
          author: book.author,
          status: book.status,
          rating: book.rating === null ? '' : String(book.rating),
          note: book.note,
        }
      : EMPTY_BOOK,
  )
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  function set(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      // rating leaves as a number or null; the server validates it again.
      await onSave({
        ...values,
        rating: values.rating === '' ? null : Number(values.rating),
      })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="card book-form" onSubmit={handleSubmit}>
      <h2>{book ? 'Edit book' : 'Add a book'}</h2>

      <div className="row">
        <label>
          Title
          <input
            type="text"
            required
            maxLength={200}
            value={values.title}
            placeholder="The Left Hand of Darkness"
            onChange={(event) => set('title', event.target.value)}
          />
        </label>
        <label>
          Author
          <input
            type="text"
            required
            maxLength={120}
            value={values.author}
            placeholder="Ursula K. Le Guin"
            onChange={(event) => set('author', event.target.value)}
          />
        </label>
      </div>

      <div className="row">
        <label>
          Status
          <select value={values.status} onChange={(event) => set('status', event.target.value)}>
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rating
          <select value={values.rating} onChange={(event) => set('rating', event.target.value)}>
            <option value="">No rating</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {'★'.repeat(value)} {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Note
        <textarea
          rows={3}
          maxLength={1000}
          value={values.note}
          placeholder="What you thought, where you stopped, who recommended it…"
          onChange={(event) => set('note', event.target.value)}
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving…' : book ? 'Save changes' : 'Add book'}
        </button>
      </div>
    </form>
  )
}
