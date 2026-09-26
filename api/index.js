// Vercel serverless entry point. The rewrite in vercel.json sends every
// /api/* request here, and the Express app is the handler.
import { app } from '../server/app.js'

export default app
