import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const expensesRouter = router({
  categories: router({
    list: publicProcedure.query(async ({ ctx }: { ctx: { prisma: any } }) => {
      return ctx.prisma.expenseCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    }),

    create: publicProcedure
      .input(z.object({
        name: z.string(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        return ctx.prisma.expenseCategory.create({ data: input })
      }),
  }),

  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.number().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = {}
      if (input?.categoryId) where.categoryId = input.categoryId
      if (input?.startDate || input?.endDate) {
        where.expenseDate = {}
        if (input.startDate) where.expenseDate.gte = input.startDate
        if (input.endDate) where.expenseDate.lte = input.endDate
      }
      return ctx.prisma.expense.findMany({
        where,
        include: { category: true, user: true },
        orderBy: { expenseDate: 'desc' },
      })
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: { category: true, user: true },
      })
    }),

  create: publicProcedure
    .input(z.object({
      categoryId: z.number(),
      userId: z.number(),
      amount: z.number(),
      expenseDate: z.date().optional(),
      isRecurring: z.boolean().default(false),
      frequency: z.string().optional(),
      description: z.string().optional(),
      referenceNo: z.string().optional(),
      paymentMethod: z.string().default('CASH'),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.expense.create({ data: input })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      amount: z.number().optional(),
      expenseDate: z.date().optional(),
      isRecurring: z.boolean().optional(),
      frequency: z.string().optional(),
      description: z.string().optional(),
      referenceNo: z.string().optional(),
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { id, ...data } = input
      return ctx.prisma.expense.update({ where: { id }, data })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.expense.delete({ where: { id: input.id } })
    }),

  summary: publicProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const now = new Date()
      let startDate: Date

      if (input.period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (input.period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const expenses = await ctx.prisma.expense.groupBy({
        by: ['categoryId'],
        where: { expenseDate: { gte: startDate } },
        _sum: { amount: true },
      })

      const categories = await ctx.prisma.expenseCategory.findMany()

      return expenses.map((e: any) => ({
        category: categories.find((c: any) => c.id === e.categoryId),
        amount: e._sum.amount,
      }))
    }),
})
