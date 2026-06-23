import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const categoriesRouter = router({
  list: publicProcedure
    .input(z.object({
      type: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = { isActive: true }
      if (input?.type) where.type = input.type
      return ctx.prisma.category.findMany({
        where,
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      })
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string(),
      nameEn: z.string().optional(),
      type: z.string().default('SILVER'),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.category.create({ data: input })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      nameEn: z.string().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { id, ...data } = input
      return ctx.prisma.category.update({ where: { id }, data })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.category.update({
        where: { id: input.id },
        data: { isActive: false },
      })
    }),
})
