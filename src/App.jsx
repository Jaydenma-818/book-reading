import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import LoginPage from './components/LoginPage'
import SetupNotice from './components/SetupNotice'
import Shelf from './components/Shelf'
import { auth, missingFirebaseConfig } from './lib/firebase'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  // Nothing to check when there is no Firebase config: no session can exist.
  const [checking, setChecking] = useState(() => auth !== null)

  useEffect(() => {
    // Without Firebase config there is no auth object to listen to; the setup
    // notice below is what the page shows instead.
    if (!auth) return undefined
    // Fires once with the restored session on load, then on every sign-in and
    // sign-out — which is what swaps between the two screens.
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setChecking(false)
    })
  }, [])

  if (missingFirebaseConfig.length > 0) {
    return <SetupNotice missing={missingFirebaseConfig} />
  }

  if (checking) {
    return (
      <main className="centered">
        <p className="muted">Loading…</p>
      </main>
    )
  }

  // Signed out means the login page, always: no book data is fetched or shown
  // until Firebase reports a signed-in user.
  return user ? <Shelf user={user} /> : <LoginPage />
}
