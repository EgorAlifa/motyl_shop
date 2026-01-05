import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withAuth } from '@/lib/api-auth'

const categorySchema = z.object({
  name: z.string().min(2, 'Название должно содержать минимум 2 символа'),
  slug: z.string().min(2, 'Slug должен содержать минимум 2 символа'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/categories - получить все категории
export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении категорий' },
      { status: 500 }
    )
  }
}

// POST /api/categories - создать категорию (только с авторизацией)
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = categorySchema.parse(body)

    // Проверяем уникальность slug
    const existing = await prisma.productCategory.findUnique({
      where: { slug: validatedData.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким slug уже существует' },
        { status: 400 }
      )
    }

    const category = await prisma.productCategory.create({
      data: validatedData,
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Category creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при создании категории' },
      { status: 500 }
    )
  }
})
