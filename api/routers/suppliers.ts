import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const suppliersRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = { isActive: true }
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { phone: { contains: input.search } },
          { code: { contains: input.search } },
        ]
      }
      return ctx.prisma.supplier.findMany({ where, orderBy: { createdAt: 'desc' } })
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.supplier.findUnique({
        where: { id: input.id },
        include: {
          purchaseInvoices: { orderBy: { invoiceDate: 'desc' } },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      })
    }),

  create: publicProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      email: z.string().optional(),
      phone: z.string().optional(),
      phone2: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      openingBalance: z.number().default(0),
      creditLimit: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.supplier.create({
        data: { ...input, balance: input.openingBalance },
      })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      phone2: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      creditLimit: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { id, ...data } = input
      return ctx.prisma.supplier.update({ where: { id }, data })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.supplier.update({
        where: { id: input.id },
        data: { isActive: false },
      })
    }),
})
