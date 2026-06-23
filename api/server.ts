import { serve } from '@hono/node-server'
import app from './index'

const port = 3001

serve({
  fetch: app.fetch,
  port,
})

console.log(`Server running at http://localhost:${port}`)
