import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { withAuth } from '@/lib/api-auth'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    const days = daysParam ? parseInt(daysParam) : 30

    const now = new Date()
    const startDate = subDays(now, days)

    // Total orders (all statuses)
    const totalOrders = await prisma.order.count()

    // Orders in selected period (all statuses)
    const recentOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Total COMPLETED orders (успешные заявки)
    const totalCompletedOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
      },
    })

    // COMPLETED orders in selected period
    const recentCompletedOrders = await prisma.order.count({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
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

    // Revenue in selected period (ТОЛЬКО из выполненных заявок)
    const recentCompletedOrdersWithAmount = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: {
          gte: startDate,
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

    // Daily orders for selected period - ОПТИМИЗИРОВАНО
    // Получаем все заказы за период одним запросом
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true,
      },
    })

    // Группируем по датам в памяти
    const dailyOrdersMap = new Map<string, { orders: number; completedOrders: number; revenue: number }>()

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const dateKey = date.toISOString().split('T')[0]
      dailyOrdersMap.set(dateKey, { orders: 0, completedOrders: 0, revenue: 0 })
    }

    // Заполняем данные из заказов
    allOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]
      const dayData = dailyOrdersMap.get(dateKey)

      if (dayData) {
        dayData.orders++
        if (order.status === 'DELIVERED') {
          dayData.completedOrders++
          dayData.revenue += order.totalAmount
        }
      }
    })

    // Преобразуем в массив
    const dailyOrders = Array.from(dailyOrdersMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }))

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
