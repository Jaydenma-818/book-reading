import { statusLabel } from '../lib/books'

export default function BookList({ books, filter, onEdit, onDelete }) {
  if (books.length === 0) {
    return (
      <p className="empty">
        {filter
          ? `No books marked “${statusLabel(filter)}” yet.`
          : 'Your shelf is empty. Add the book you are reading now.'}
      </p>
    )
  }

  return (
    <ul className="books">
      {books.map((book) => (
        <li key={book.id} className="card book">
          <div className="book-head">
            <div>
              <h3>{book.title}</h3>
              <p className="muted">{book.author}</p>
            </div>
            <span className={`badge ${book.status}`}>{statusLabel(book.status)}</span>
          </div>

          <Rating value={book.rating} />

          {book.note && <p className="note">{book.note}</p>}

          <div className="book-actions">
            <button type="button" className="ghost" onClick={() => onEdit(book)}>
              Edit
            </button>
            <button type="button" className="ghost danger" onClick={() => onDelete(book)}>
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Rating({ value }) {
  if (value === null) return <p className="rating muted">Not rated</p>
  return (
    <p className="rating" aria-label={`${value} out of 5`}>
      <span aria-hidden="true">
        {'★'.repeat(value)}
        <span className="dim">{'★'.repeat(5 - value)}</span>
      </span>
    </p>
  )
}
