import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withAuth } from '@/lib/api-auth'

// Функция транслитерации кириллицы в латиницу для slug
function transliterate(text: string): string {
  const cyrillic = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '',
    'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  } as const

  return text
    .split('')
    .map((char) => cyrillic[char as keyof typeof cyrillic] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // заменяем все не латиницу и не цифры на дефис
    .replace(/^-+|-+$/g, '') // убираем дефисы в начале и конце
}

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().min(1),
  price: z.number().min(0),
  stock: z.number().min(0),
  unit: z.string().default('г'),
  minOrder: z.number().min(1).default(50),
  categoryId: z.string(), // Теперь используем ID категории
  storage: z.string().min(1),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Генерируем slug из name если он не указан или на кириллице
    const slug = !validatedData.slug || /[а-яА-ЯёЁ]/.test(validatedData.slug)
      ? transliterate(validatedData.name)
      : validatedData.slug

    const product = await prisma.product.create({
      data: {
        ...validatedData,
        slug,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Product creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при создании товара' },
      { status: 500 }
    )
  }
})

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true, // Включаем связанную категорию
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении товаров' },
      { status: 500 }
    )
  }
}
