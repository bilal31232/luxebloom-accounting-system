import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const reportsRouter = router({
  salesReport: publicProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      customerId: z.number().optional(),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = {
        invoiceDate: { gte: input.startDate, lte: input.endDate },
        status: 'CONFIRMED',
      }
      if (input.customerId) where.customerId = input.customerId

      const invoices = await ctx.prisma.salesInvoice.findMany({
        where,
        include: { customer: true, items: { include: { product: true } } },
        orderBy: { invoiceDate: 'desc' },
      })

      const summary = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum: number, inv: any) => sum + inv.total, 0),
        totalPaid: invoices.reduce((sum: number, inv: any) => sum + inv.paid, 0),
        totalUnpaid: invoices.reduce((sum: number, inv: any) => sum + (inv.total - inv.paid), 0),
      }

      return { invoices, summary }
    }),

  purchasesReport: publicProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      supplierId: z.number().optional(),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const where: any = {
        invoiceDate: { gte: input.startDate, lte: input.endDate },
        status: 'CONFIRMED',
      }
      if (input.supplierId) where.supplierId = input.supplierId

      const invoices = await ctx.prisma.purchaseInvoice.findMany({
        where,
        include: { supplier: true, items: { include: { product: true } } },
        orderBy: { invoiceDate: 'desc' },
      })

      const summary = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum: number, inv: any) => sum + inv.total, 0),
        totalPaid: invoices.reduce((sum: number, inv: any) => sum + inv.paid, 0),
        totalUnpaid: invoices.reduce((sum: number, inv: any) => sum + (inv.total - inv.paid), 0),
      }

      return { invoices, summary }
    }),

  inventoryReport: publicProcedure
    .query(async ({ ctx }: { ctx: { prisma: any } }) => {
      const products = await ctx.prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { quantity: 'asc' },
      })

      const summary = {
        totalProducts: products.length,
        totalQuantity: products.reduce((sum: number, p: any) => sum + p.quantity, 0),
        totalWeight: products.reduce((sum: number, p: any) => sum + p.weightGram, 0),
        totalValue: products.reduce((sum: number, p: any) => sum + (p.purchasePrice * p.quantity), 0),
        lowStock: products.filter((p: any) => p.quantity <= p.minQuantity).length,
      }

      return { products, summary }
    }),

  customerStatement: publicProcedure
    .input(z.object({
      customerId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const customer = await ctx.prisma.customer.findUnique({
        where: { id: input.customerId },
      })

      const invoices = await ctx.prisma.salesInvoice.findMany({
        where: {
          customerId: input.customerId,
          status: 'CONFIRMED',
          ...(input.startDate && { invoiceDate: { gte: input.startDate, lte: input.endDate } }),
        },
        include: { items: true },
        orderBy: { invoiceDate: 'desc' },
      })

      const payments = await ctx.prisma.customerPayment.findMany({
        where: {
          customerId: input.customerId,
          ...(input.startDate && { paymentDate: { gte: input.startDate, lte: input.endDate } }),
        },
        orderBy: { paymentDate: 'desc' },
      })

      const totalInvoices = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
      const totalPayments = payments.reduce((sum: number, p: any) => sum + p.amount, 0)

      return {
        customer,
        invoices,
        payments,
        summary: {
          totalInvoices,
          totalPayments,
          balance: totalInvoices - totalPayments,
        },
      }
    }),

  supplierStatement: publicProcedure
    .input(z.object({
      supplierId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: any }) => {
      const supplier = await ctx.prisma.supplier.findUnique({
        where: { id: input.supplierId },
      })

      const invoices = await ctx.prisma.purchaseInvoice.findMany({
        where: {
          supplierId: input.supplierId,
          status: 'CONFIRMED',
          ...(input.startDate && { invoiceDate: { gte: input.startDate, lte: input.endDate } }),
        },
        include: { items: true },
        orderBy: { invoiceDate: 'desc' },
      })

      const payments = await ctx.prisma.supplierPayment.findMany({
        where: {
          supplierId: input.supplierId,
          ...(input.startDate && { paymentDate: { gte: input.startDate, lte: input.endDate } }),
        },
        orderBy: { paymentDate: 'desc' },
      })

      const totalInvoices = invoices.reduce((sum: number, inv: any) => sum + inv.total, 0)
      const totalPayments = payments.reduce((sum: number, p: any) => sum + p.amount, 0)

      return {
        supplier,
        invoices,
        payments,
        summary: {
          totalInvoices,
          totalPayments,
          balance: totalInvoices - totalPayments,
        },
      }
    }),
})
