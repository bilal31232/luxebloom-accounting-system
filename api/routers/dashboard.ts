import { router, publicProcedure } from '../../src/lib/trpc'
import { z } from 'zod'

export const dashboardRouter = router({
  stats: publicProcedure.query(async ({ ctx }: { ctx: { prisma: any } }) => {
    const prisma = ctx.prisma

    const [
      totalProducts,
      totalCustomers,
      totalSuppliers,
      lowStockProducts,
      todaySales,
      todayPurchases,
      totalSales,
      totalPurchases,
      totalExpenses,
      customerDebts,
      supplierDebts,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          OR: [
            { quantity: { lte: prisma.product.fields.minQuantity } },
            { weightGram: { lte: prisma.product.fields.minWeight } },
          ],
        },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          invoiceDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: 'CONFIRMED',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.purchaseInvoice.aggregate({
        where: {
          invoiceDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          status: 'CONFIRMED',
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.salesInvoice.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { total: true },
      }),
      prisma.purchaseInvoice.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.customer.aggregate({
        where: { balance: { gt: 0 } },
        _sum: { balance: true },
      }),
      prisma.supplier.aggregate({
        where: { balance: { gt: 0 } },
        _sum: { balance: true },
      }),
    ])

    return {
      totalProducts,
      totalCustomers,
      totalSuppliers,
      lowStockProducts,
      todaySales: todaySales._sum.total || 0,
      todaySalesCount: todaySales._count,
      todayPurchases: todayPurchases._sum.total || 0,
      todayPurchasesCount: todayPurchases._count,
      totalSales: totalSales._sum.total || 0,
      totalPurchases: totalPurchases._sum.total || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      customerDebts: customerDebts._sum.balance || 0,
      supplierDebts: supplierDebts._sum.balance || 0,
      netProfit: (totalSales._sum.total || 0) - (totalPurchases._sum.total || 0) - (totalExpenses._sum.amount || 0),
    }
  }),

  chartData: publicProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }: { ctx: { prisma: any }, input: { period: string } }) => {
      const prisma = ctx.prisma
      const now = new Date()
      let startDate: Date

      if (input.period === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (input.period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      } else {
        startDate = new Date(now.getFullYear(), 0, 1)
      }

      const sales = await prisma.salesInvoice.findMany({
        where: {
          invoiceDate: { gte: startDate },
          status: 'CONFIRMED',
        },
        select: { invoiceDate: true, total: true },
      })

      const purchases = await prisma.purchaseInvoice.findMany({
        where: {
          invoiceDate: { gte: startDate },
          status: 'CONFIRMED',
        },
        select: { invoiceDate: true, total: true },
      })

      const expenses = await prisma.expense.findMany({
        where: {
          expenseDate: { gte: startDate },
        },
        select: { expenseDate: true, amount: true },
      })

      // Group by date
      const salesMap = new Map<string, number>()
      const purchasesMap = new Map<string, number>()
      const expensesMap = new Map<string, number>()

      sales.forEach((s: any) => {
        const key = s.invoiceDate.toISOString().split('T')[0]
        salesMap.set(key, (salesMap.get(key) || 0) + s.total)
      })

      purchases.forEach((p: any) => {
        const key = p.invoiceDate.toISOString().split('T')[0]
        purchasesMap.set(key, (purchasesMap.get(key) || 0) + p.total)
      })

      expenses.forEach((e: any) => {
        const key = e.expenseDate.toISOString().split('T')[0]
        expensesMap.set(key, (expensesMap.get(key) || 0) + e.amount)
      })

      const allDates = [...new Set([...salesMap.keys(), ...purchasesMap.keys(), ...expensesMap.keys()])].sort()

      return {
        labels: allDates,
        sales: allDates.map(d => salesMap.get(d) || 0),
        purchases: allDates.map(d => purchasesMap.get(d) || 0),
        expenses: allDates.map(d => expensesMap.get(d) || 0),
      }
    }),

  recentActivity: publicProcedure.query(async ({ ctx }: { ctx: { prisma: any } }) => {
    const prisma = ctx.prisma

    const [recentSales, recentPurchases, lowStock] = await Promise.all([
      prisma.salesInvoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
      prisma.purchaseInvoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { quantity: { lte: 10 } },
            { weightGram: { lte: 50 } },
          ],
        },
        take: 5,
      }),
    ])

    return {
      recentSales,
      recentPurchases,
      lowStock,
    }
  }),

  topProducts: publicProcedure.query(async ({ ctx }: { ctx: { prisma: any } }) => {
    const prisma = ctx.prisma

    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    })

    const productsWithDetails = await Promise.all(
      topProducts.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true },
        })
        return {
          ...product,
          totalSold: item._sum.quantity,
          totalRevenue: item._sum.total,
        }
      })
    )

    return productsWithDetails
  }),
})
