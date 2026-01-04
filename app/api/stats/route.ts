import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { withAuth } from '@/lib/api-auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Total orders (all statuses)
    const totalOrders = await prisma.order.count()

    // Orders in last 30 days (all statuses)
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Total COMPLETED orders (успешные заявки)
    const totalCompletedOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
      },
    })

    // COMPLETED orders in last 30 days
    const recentCompletedOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    })

    // Total revenue (ТОЛЬКО из выполненных заявок)
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
      },
      select: { totalAmount: true },
    })
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

    // Revenue in last 30 days (ТОЛЬКО из выполненных заявок)
    const recentCompletedOrdersWithAmount = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: { totalAmount: true },
    })
    const recentRevenue = recentCompletedOrdersWithAmount.reduce(
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

      const completedCount = await prisma.order.count({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      })

      const dayCompletedOrders = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: { totalAmount: true },
      })

      const revenue = dayCompletedOrders.reduce((sum, order) => sum + order.totalAmount, 0)

      dailyOrders.push({
        date: date.toISOString().split('T')[0],
        orders: count,
        completedOrders: completedCount,
        revenue,
      })
    }

    return NextResponse.json({
      totalOrders,
      recentOrders,
      totalCompletedOrders,
      recentCompletedOrders,
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
})
