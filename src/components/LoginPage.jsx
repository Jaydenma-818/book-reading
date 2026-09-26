import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { authErrorMessage } from '../lib/authErrors'

export default function LoginPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  async function run(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
      // No navigation needed: the auth listener in App swaps the screen. Both
      // Google and email/password land in exactly the same signed-in state.
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleGoogle() {
    run(() => signInWithPopup(auth, googleProvider))
  }

  function handleSubmit(event) {
    event.preventDefault()
    run(async () => {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const trimmed = name.trim()
        if (trimmed) await updateProfile(credential.user, { displayName: trimmed })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    })
  }

  return (
    <main className="centered">
      <div className="card login-card">
        <BookMark />
        <h1>Book Reading Log</h1>
        <p className="muted">Sign in to see your shelf.</p>

        <button type="button" className="google" onClick={handleGoogle} disabled={busy}>
          <GoogleMark />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              Name
              <input
                type="text"
                value={name}
                autoComplete="name"
                placeholder="Your name"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'Working…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="muted switch">
          {isSignUp ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup')
              setError(null)
            }}
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </main>
  )
}

function BookMark() {
  return (
    <svg className="logo" width="40" height="40" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path
        d="M16 11.2c-1.7-1.2-3.9-1.9-6.3-1.9H7.2a1 1 0 0 0-1 1v11.4a1 1 0 0 0 1 1h2.5c2.4 0 4.6.7 6.3 1.9 1.7-1.2 3.9-1.9 6.3-1.9h2.5a1 1 0 0 0 1-1V10.3a1 1 0 0 0-1-1h-2.5c-2.4 0-4.6.7-6.3 1.9Z"
        fill="#fff"
      />
      <path d="M16 11.2v13.4" stroke="var(--accent)" strokeWidth="1.3" fill="none" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  )
}
