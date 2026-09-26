import express from 'express'
import { books } from './books.js'
import { logError, refuse } from './refuse.js'

const api = express.Router()

api.use(express.json({ limit: '32kb' }))
api.get('/health', (_req, res) => res.json({ ok: true }))
api.use('/books', books)

// Unknown endpoint under /api — logged like any other refusal.
api.use((req, res) =>
  refuse(req, res, 404, `no route for ${req.method} ${req.originalUrl}`, 'Not found.'),
)

// Malformed JSON bodies and anything else thrown by the stack above.
api.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return refuse(req, res, 400, `invalid JSON body: ${err.message}`, 'Invalid request.')
  }
  if (err.type === 'entity.too.large') {
    return refuse(req, res, 413, `request body over limit: ${err.message}`, 'Request too large.')
  }
  logError(req, err)
  return res.status(500).json({ error: 'Something went wrong. Please try again.' })
})

export const app = express()
app.disable('x-powered-by')

// Mounted at /api, which is where both the Vite dev proxy and the Vercel rewrite
// send requests. Also mounted at the root because Vercel may hand the function a
// path with the /api prefix already stripped; mounting both ways keeps one code
// path correct under either behaviour.
app.use('/api', api)
app.use('/', api)
