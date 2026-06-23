import { initTRPC } from '@trpc/server'
import { prisma } from './prisma'
import superjson from 'superjson'
import { dashboardRouter } from '../../api/routers/dashboard'
import { productsRouter } from '../../api/routers/products'
import { categoriesRouter } from '../../api/routers/categories'
import { customersRouter } from '../../api/routers/customers'
import { suppliersRouter } from '../../api/routers/suppliers'
import { salesRouter } from '../../api/routers/sales'
import { purchasesRouter } from '../../api/routers/purchases'
import { expensesRouter } from '../../api/routers/expenses'
import { accountingRouter } from '../../api/routers/accounting'
import { reportsRouter } from '../../api/routers/reports'

export const t = initTRPC.create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure.use(async ({ ctx, next }) => {
  return next({
    ctx: {
      ...ctx,
      prisma,
    },
  })
})

// Root router with all sub-routers
export const appRouter = router({
  dashboard: dashboardRouter,
  products: productsRouter,
  categories: categoriesRouter,
  customers: customersRouter,
  suppliers: suppliersRouter,
  sales: salesRouter,
  purchases: purchasesRouter,
  expenses: expensesRouter,
  accounting: accountingRouter,
  reports: reportsRouter,
})

export type AppRouter = typeof appRouter
