import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Total orders
    const totalOrders = await prisma.order.count()

    // Orders in last 30 days
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Total revenue
    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    })
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Revenue in last 30 days
    const recentOrdersWithAmount = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: { totalAmount: true },
    })
    const recentRevenue = recentOrdersWithAmount.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    )

    // Orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    })

    // Top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        })
        return {
          product,
          totalQuantity: item._sum.quantity || 0,
          orderCount: item._count.productId,
        }
      })
    )

    // Daily orders for last 30 days
    const dailyOrders = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const count = await prisma.order.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: { totalAmount: true },
      })

      const revenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0)

      dailyOrders.push({
        date: date.toISOString().split('T')[0],
        orders: count,
        revenue,
      })
    }

    return NextResponse.json({
      totalOrders,
      recentOrders,
      totalRevenue,
      recentRevenue,
      ordersByStatus,
      topProducts: topProductsWithDetails,
      dailyOrders,
    })
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    )
  }
}
