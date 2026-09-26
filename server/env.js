import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

// Load this project's .env. Resolved relative to this file rather than cwd, so
// `npm run server` works from anywhere. On Vercel there is no .env file — the
// same variable names come from the project's environment variables instead.
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envFile = path.join(projectRoot, '.env')
if (existsSync(envFile)) {
  dotenv.config({ path: envFile, quiet: true })
}

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        `Set it in .env locally, or add it to the project's environment variables on Vercel.`,
    )
  }
  return value
}

// The Firebase project id is stored in .env exactly once, under the name the
// frontend needs (Vite only exposes VITE_-prefixed variables to the browser).
// The backend verifies tokens against that same value, so there is no second
// copy to fall out of sync.
export const firebaseProjectId = required('VITE_FIREBASE_PROJECT_ID')

// Server-only credentials: no VITE_ prefix, so Vite cannot bundle them into the
// client even by accident.
export const tursoUrl = required('TURSO_DATABASE_URL')
export const tursoAuthToken = process.env.TURSO_AUTH_TOKEN ?? ''

export const port = Number(process.env.PORT ?? 3001)
