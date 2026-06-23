import { Hono } from 'hono'
import { trpcServer } from '@trpc/server/adapters/fetch'
import { appRouter } from '../src/lib/trpc'

const app = new Hono()

// tRPC API endpoint
app.use('/trpc/*', async (c) => {
  return trpcServer({
    router: appRouter,
    createContext: () => ({}),
  })(c.req.raw)
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

export default app
