import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const purchasesRouter = router({
  list: publicProcedure
    .input(z.object({
      search: z.string().optional(),
      supplierId: z.number().optional(),
      status: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = {}
      if (input?.supplierId) where.supplierId = input.supplierId
      if (input?.status) where.status = input.status
      if (input?.search) {
        where.OR = [
          { invoiceNo: { contains: input.search } },
          { supplier: { name: { contains: input.search } } },
        ]
      }
      return ctx.prisma.purchaseInvoice.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { invoiceDate: 'desc' },
      })
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.purchaseInvoice.findUnique({
        where: { id: input.id },
        include: {
          supplier: true,
          items: { include: { product: true } },
          payments: true,
        },
      })
    }),

  create: publicProcedure
    .input(z.object({
      invoiceNo: z.string(),
      supplierId: z.number(),
      userId: z.number(),
      invoiceDate: z.date().optional(),
      dueDate: z.date().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number(),
        weightGram: z.number().default(0),
        unitPrice: z.number(),
        total: z.number(),
      })),
      subtotal: z.number(),
      discount: z.number().default(0),
      discountType: z.string().default('FIXED'),
      tax: z.number().default(0),
      shipping: z.number().default(0),
      total: z.number(),
      paymentMethod: z.string().default('CASH'),
      notes: z.string().optional(),
      status: z.string().default('CONFIRMED'),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { items, ...invoiceData } = input

      return ctx.prisma.$transaction(async (tx: any) => {
        const invoice = await tx.purchaseInvoice.create({
          data: {
            ...invoiceData,
            items: { create: items },
          },
          include: { items: true },
        })

        // Update inventory
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.quantity },
              weightGram: { increment: item.weightGram },
              purchasePrice: item.unitPrice,
            },
          })

          await tx.inventoryLog.create({
            data: {
              productId: item.productId,
              type: 'PURCHASE',
              quantity: item.quantity,
              weightGram: item.weightGram,
              referenceId: invoice.id,
              referenceType: 'PURCHASE_INVOICE',
            },
          })
        }

        // Update supplier balance
        await tx.supplier.update({
          where: { id: invoiceData.supplierId },
          data: {
            balance: { increment: invoiceData.total },
          },
        })

        return invoice
      })
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      supplierId: z.number().optional(),
      status: z.string().optional(),
      paymentStatus: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const { id, ...data } = input
      return ctx.prisma.purchaseInvoice.update({ where: { id }, data })
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.purchaseInvoice.update({
        where: { id: input.id },
        data: { status: 'CANCELLED' },
      })
    }),

  addPayment: publicProcedure
    .input(z.object({
      supplierId: z.number(),
      invoiceId: z.number().optional(),
      amount: z.number(),
      paymentMethod: z.string().default('CASH'),
      referenceNo: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      return ctx.prisma.$transaction(async (tx: any) => {
        const payment = await tx.supplierPayment.create({ data: input })

        await tx.supplier.update({
          where: { id: input.supplierId },
          data: { balance: { decrement: input.amount } },
        })

        if (input.invoiceId) {
          await tx.purchaseInvoice.update({
            where: { id: input.invoiceId },
            data: { paid: { increment: input.amount } },
          })
        }

        return payment
      })
    }),
})
