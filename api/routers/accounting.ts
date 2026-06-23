import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const accountingRouter = router({
  accounts: router({
    list: publicProcedure
      .input(z.object({
        type: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        const where: any = { isActive: true }
        if (input?.type) where.type = input.type
        return ctx.prisma.account.findMany({
          where,
          include: { parent: true, children: true },
          orderBy: { code: 'asc' },
        })
      }),

    create: publicProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        nameEn: z.string().optional(),
        type: z.string(),
        parentId: z.number().optional(),
        openingBalance: z.number().default(0),
      }))
      .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        return ctx.prisma.account.create({
          data: { ...input, currentBalance: input.openingBalance },
        })
      }),
  }),

  journalEntries: router({
    list: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        const where: any = {}
        if (input?.startDate || input?.endDate) {
          where.entryDate = {}
          if (input.startDate) where.entryDate.gte = input.startDate
          if (input.endDate) where.entryDate.lte = input.endDate
        }
        return ctx.prisma.journalEntry.findMany({
          where,
          include: {
            user: true,
            items: {
              include: {
                debitAccount: true,
                creditAccount: true,
              },
            },
          },
          orderBy: { entryDate: 'desc' },
        })
      }),

    create: publicProcedure
      .input(z.object({
        entryNo: z.string(),
        userId: z.number(),
        entryDate: z.date().optional(),
        description: z.string(),
        reference: z.string().optional(),
        items: z.array(z.object({
          debitAccountId: z.number().optional(),
          creditAccountId: z.number().optional(),
          debit: z.number().default(0),
          credit: z.number().default(0),
          description: z.string().optional(),
        })),
        totalDebit: z.number(),
        totalCredit: z.number(),
      }))
      .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        const { items, ...entryData } = input
        return ctx.prisma.journalEntry.create({
          data: {
            ...entryData,
            items: { create: items },
          },
          include: { items: { include: { debitAccount: true, creditAccount: true } } },
        })
      }),

    post: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
        return ctx.prisma.journalEntry.update({
          where: { id: input.id },
          data: { isPosted: true, postedAt: new Date() },
        })
      }),
  }),

  financialStatements: publicProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const endDate = input?.endDate || new Date()
      const startDate = input?.startDate || new Date(endDate.getFullYear(), 0, 1)

      const accounts = await ctx.prisma.account.findMany({
        include: {
          debitEntries: {
            where: {
              entry: { entryDate: { gte: startDate, lte: endDate } },
            },
          },
          creditEntries: {
            where: {
              entry: { entryDate: { gte: startDate, lte: endDate } },
            },
          },
        },
      })

      const incomeStatement = {
        revenue: accounts
          .filter((a: any) => a.type === 'REVENUE')
          .reduce((sum: number, a: any) => {
            const credit = a.creditEntries.reduce((s: number, e: any) => s + e.credit, 0)
            const debit = a.debitEntries.reduce((s: number, e: any) => s + e.debit, 0)
            return sum + (credit - debit)
          }, 0),
        expenses: accounts
          .filter((a: any) => a.type === 'EXPENSE')
          .reduce((sum: number, a: any) => {
            const debit = a.debitEntries.reduce((s: number, e: any) => s + e.debit, 0)
            const credit = a.creditEntries.reduce((s: number, e: any) => s + e.credit, 0)
            return sum + (debit - credit)
          }, 0),
      }

      const balanceSheet = {
        assets: accounts
          .filter((a: any) => a.type === 'ASSET')
          .reduce((sum: number, a: any) => {
            const debit = a.debitEntries.reduce((s: number, e: any) => s + e.debit, 0)
            const credit = a.creditEntries.reduce((s: number, e: any) => s + e.credit, 0)
            return sum + a.openingBalance + (debit - credit)
          }, 0),
        liabilities: accounts
          .filter((a: any) => a.type === 'LIABILITY')
          .reduce((sum: number, a: any) => {
            const credit = a.creditEntries.reduce((s: number, e: any) => s + e.credit, 0)
            const debit = a.debitEntries.reduce((s: number, e: any) => s + e.debit, 0)
            return sum + a.openingBalance + (credit - debit)
          }, 0),
        equity: accounts
          .filter((a: any) => a.type === 'EQUITY')
          .reduce((sum: number, a: any) => {
            const credit = a.creditEntries.reduce((s: number, e: any) => s + e.credit, 0)
            const debit = a.debitEntries.reduce((s: number, e: any) => s + e.debit, 0)
            return sum + a.openingBalance + (credit - debit)
          }, 0),
      }

      return {
        incomeStatement: {
          ...incomeStatement,
          netProfit: incomeStatement.revenue - incomeStatement.expenses,
        },
        balanceSheet: {
          ...balanceSheet,
          totalLiabilitiesAndEquity: balanceSheet.liabilities + balanceSheet.equity,
        },
        period: { startDate, endDate },
      }
    }),
})
