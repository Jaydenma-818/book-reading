/**
 * Whole-shelf totals, computed by the server so they do not shift when a filter
 * is applied. The average covers finished books that carry a rating.
 */
export default function Stats({ stats }) {
  const average = stats.averageRating
  return (
    <section className="stats">
      <div className="stat">
        <span className="stat-label">Books</span>
        <strong className="stat-value">{stats.total}</strong>
        <span className="stat-note">on your shelf</span>
      </div>
      <div className="stat">
        <span className="stat-label">Average rating</span>
        <strong className="stat-value">{average === null ? '—' : average.toFixed(1)}</strong>
        <span className="stat-note">
          {average === null
            ? 'rate a finished book'
            : `from ${stats.ratedFinished} rated finished book${stats.ratedFinished === 1 ? '' : 's'}`}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Finished</span>
        <strong className="stat-value">{stats.finished}</strong>
        <span className="stat-note">read all the way through</span>
      </div>
    </section>
  )
}
