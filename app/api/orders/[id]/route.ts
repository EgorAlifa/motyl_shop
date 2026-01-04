import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, AuthUser } from '@/lib/api-auth'

export const PATCH = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: { id: string } }
) => {
  try {
    const body = await request.json()
    const { status } = body
    const orderId = context?.params?.id

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID заявки не указан' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Укажите новый статус' },
        { status: 400 }
      )
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Failed to update order:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении заявки' },
      { status: 500 }
    )
  }
})

export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: { id: string } }
) => {
  try {
    const orderId = context?.params?.id

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID заявки не указан' },
        { status: 400 }
      )
    }

    await prisma.order.delete({
      where: { id: orderId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete order:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении заявки' },
      { status: 500 }
    )
  }
})
