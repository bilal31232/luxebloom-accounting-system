import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const productsRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      categoryId: z.number().optional(),
      itemType: z.string().optional(),
      lowStock: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = { isActive: true }
      
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search } },
          { code: { contains: input.search } },
          { barcode: { contains: input.search } },
        ]
      }
      
      if (input?.categoryId) where.categoryId = input.categoryId
      if (input?.itemType) where.itemType = input.itemType
      if (input?.lowStock) {
        where.OR = [
          { quantity: { lte: { minQuantity: true } } },
        ]
      }

      return ctx.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      })
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.product.findUnique({
        where: { id: input.id },
        include: { category: true },
      })
    }),

  create: publicProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      nameEn: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.number(),
      itemType: z.string().default('SILVER'),
      unit: z.string().default('PIECE'),
      quantity: z.number().default(0),
      weightGram: z.number().default(0),
      minQuantity: z.number().default(5),
      minWeight: z.number().default(10),
      purchasePrice: z.number().default(0),
      salePrice: z.number().default(0),
      wholesalePrice: z.number().default(0),
      purity: z.string().optional(),
      barcode: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.product.create({ data: input })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      code: z.string().optional(),
      name: z.string().optional(),
      nameEn: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      itemType: z.string().optional(),
      unit: z.string().optional(),
      quantity: z.number().optional(),
      weightGram: z.number().optional(),
      minQuantity: z.number().optional(),
      minWeight: z.number().optional(),
      purchasePrice: z.number().optional(),
      salePrice: z.number().optional(),
      wholesalePrice: z.number().optional(),
      purity: z.string().optional(),
      barcode: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { id, ...data } = input
      return ctx.prisma.product.update({ where: { id }, data })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.product.update({
        where: { id: input.id },
        data: { isActive: false },
      })
    }),
})
