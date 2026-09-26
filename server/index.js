// Local development entry point: `npm run server`.
// On Vercel this file is unused — api/index.js serves the same app instead.
import { app } from './app.js'
import { ensureSchema } from './db.js'
import { port } from './env.js'

// Fail loudly at boot if the database is unreachable, rather than on the first
// request a user makes.
await ensureSchema()

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}/api`)
})
