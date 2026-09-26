/**
 * Shown when .env has no Firebase web config yet. Without it there is nothing to
 * sign in against, so the page says what is missing instead of rendering blank.
 */
export default function SetupNotice({ missing }) {
  return (
    <main className="centered">
      <div className="card setup-card">
        <h1>Almost there</h1>
        <p className="muted">
          The Firebase settings this app signs in with are not filled in yet.
        </p>

        <p className="setup-label">Empty in .env:</p>
        <ul className="setup-list">
          {missing.map((name) => (
            <li key={name}>
              <code>{name}</code>
            </li>
          ))}
        </ul>

        <ol className="setup-steps">
          <li>
            Open the Firebase console → Project settings → Your apps → your web app, and copy
            its config values.
          </li>
          <li>
            Paste them into <code>.env</code> in the project root, one per line, without quotes.
          </li>
          <li>
            Restart the dev server — <code>npm run dev</code> reads <code>.env</code> only at
            startup.
          </li>
        </ol>

        <p className="muted">
          The backend needs <code>TURSO_DATABASE_URL</code> and <code>TURSO_AUTH_TOKEN</code> in
          the same file, and runs with <code>npm run server</code>.
        </p>
      </div>
    </main>
  )
}
