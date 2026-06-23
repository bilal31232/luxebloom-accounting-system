import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migration: {
    path: './prisma/migrations',
    seed: './prisma/seed.ts',
  },
  database: {
    url: 'file:./prisma/dev.db',
  },
})
