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
    const productId = context?.params?.id

    if (!productId) {
      return NextResponse.json(
        { error: 'ID товара не указан' },
        { status: 400 }
      )
    }

    // Извлекаем только поля, которые можно обновлять
    const {
      id,
      createdAt,
      updatedAt,
      category,
      ...updateData
    } = body

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true, // Включаем связанную категорию в ответ
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении товара' },
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
    const productId = context?.params?.id

    if (!productId) {
      return NextResponse.json(
        { error: 'ID товара не указан' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении товара' },
      { status: 500 }
    )
  }
})
