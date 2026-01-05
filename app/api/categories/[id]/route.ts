import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withAuth, AuthUser } from '@/lib/api-auth'

const categorySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// PATCH /api/categories/[id] - обновить категорию
export const PATCH = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    if (!context) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Если меняется slug, проверяем уникальность
    if (validatedData.slug) {
      const existing = await prisma.productCategory.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: id },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Категория с таким slug уже существует' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Category update error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    )
  }
})

// DELETE /api/categories/[id] - удалить категорию
export const DELETE = withAuth(async (
  request: NextRequest,
  user: AuthUser,
  context?: { params: Promise<{ id: string }> }
) => {
  try {
    if (!context) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { id } = await context.params

    // Проверяем, есть ли товары в этой категории
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Невозможно удалить категорию: в ней ${productsCount} товаров` },
        { status: 400 }
      )
    }

    await prisma.productCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Category deletion error:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при удалении категории' },
      { status: 500 }
    )
  }
})
