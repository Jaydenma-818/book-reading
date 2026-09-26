import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut } from 'firebase/auth'
import BookForm from './BookForm'
import BookList from './BookList'
import Stats from './Stats'
import { auth } from '../lib/firebase'
import { createBook, deleteBook, listBooks, updateBook } from '../lib/api'
import { STATUSES } from '../lib/books'

export default function Shelf({ user }) {
  const [books, setBooks] = useState([])
  const [stats, setStats] = useState({ total: 0, finished: 0, ratedFinished: 0, averageRating: null })
  const [filter, setFilter] = useState('') // '' means every status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // null | 'new' | a book

  // Guards against a slow earlier response overwriting a newer one when the
  // filter is changed twice in quick succession.
  const latest = useRef(0)

  const refresh = useCallback(async (status) => {
    const ticket = ++latest.current
    setLoading(true)
    try {
      const data = await listBooks(status)
      if (ticket !== latest.current) return
      setBooks(data.books)
      setStats(data.stats)
      setError(null)
    } catch (err) {
      if (ticket === latest.current) setError(err.message)
    } finally {
      if (ticket === latest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetching is exactly the "synchronize with an external system" case an
    // effect is for; the one synchronous setState here is the loading flag.
    // oxlint-disable-next-line react/set-state-in-effect
    refresh(filter)
  }, [filter, refresh])

  // After any change the list is re-read for the current filter, so a book that
  // no longer matches the filter (or now sorts elsewhere) is never left behind.
  async function save(values) {
    if (editing && editing !== 'new') {
      await updateBook(editing.id, values)
    } else {
      await createBook(values)
    }
    setEditing(null)
    await refresh(filter)
  }

  async function remove(book) {
    if (!window.confirm(`Remove “${book.title}” from your shelf?`)) return
    try {
      await deleteBook(book.id)
      await refresh(filter)
    } catch (err) {
      setError(err.message)
    }
  }

  const who = user.displayName?.trim() || user.email || 'your shelf'

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Book Reading Log</h1>
          <p className="muted">{who}</p>
        </div>
        <button type="button" className="ghost" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </header>

      <Stats stats={stats} />

      <div className="toolbar">
        <div className="filters" role="group" aria-label="Filter by status">
          <FilterButton current={filter} value="" onSelect={setFilter}>
            All
          </FilterButton>
          {STATUSES.map((status) => (
            <FilterButton
              key={status.value}
              current={filter}
              value={status.value}
              onSelect={setFilter}
            >
              {status.label}
            </FilterButton>
          ))}
        </div>
        <button type="button" className="primary" onClick={() => setEditing('new')}>
          Add book
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {editing && (
        <BookForm
          book={editing === 'new' ? null : editing}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading ? (
        <p className="muted">Loading your books…</p>
      ) : (
        <BookList books={books} filter={filter} onEdit={setEditing} onDelete={remove} />
      )}
    </div>
  )
}

function FilterButton({ current, value, onSelect, children }) {
  const active = current === value
  return (
    <button
      type="button"
      className={active ? 'chip active' : 'chip'}
      aria-pressed={active}
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  )
}
