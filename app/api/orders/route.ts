import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendOrderEmail } from '@/lib/email'
import { generateOrderNumber } from '@/lib/utils'
import { z } from 'zod'

const orderSchema = z.object({
  customerName: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  customerEmail: z.string().email('Некорректный email'),
  customerPhone: z.string().min(10, 'Некорректный номер телефона'),
  deliveryAddress: z.string().min(10, 'Введите полный адрес доставки'),
  deliveryDate: z.string().optional(),
  comment: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1, 'Добавьте хотя бы один товар'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = orderSchema.parse(body)

    // Get products to calculate total
    const products = await prisma.product.findMany({
      where: {
        id: { in: validatedData.items.map((item) => item.productId) },
      },
    })

    // Check stock and calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of validatedData.items) {
      const product = products.find((p) => p.id === item.productId)

      if (!product) {
        return NextResponse.json(
          { error: `Товар не найден: ${item.productId}` },
          { status: 404 }
        )
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Товар "${product.name}" недоступен` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Недостаточно товара "${product.name}" на складе` },
          { status: 400 }
        )
      }

      if (item.quantity < product.minOrder) {
        return NextResponse.json(
          {
            error: `Минимальный заказ для "${product.name}": ${product.minOrder} ${product.unit}`,
          },
          { status: 400 }
        )
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        unit: product.unit,
      })
    }

    // Create order
    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        deliveryAddress: validatedData.deliveryAddress,
        deliveryDate: validatedData.deliveryDate
          ? new Date(validatedData.deliveryDate)
          : null,
        comment: validatedData.comment || null,
        totalAmount,
        items: {
          create: validatedData.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            }
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Update stock
    for (const item of validatedData.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Send email
    try {
      await sendOrderEmail({
        orderNumber,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        deliveryAddress: validatedData.deliveryAddress,
        deliveryDate: validatedData.deliveryDate
          ? new Date(validatedData.deliveryDate)
          : null,
        comment: validatedData.comment || null,
        items: orderItems,
        totalAmount,
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail the order if email fails
    }

    return NextResponse.json(
      {
        success: true,
        orderNumber,
        orderId: order.id,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Order creation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Ошибка при создании заявки' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении заявок' },
      { status: 500 }
    )
  }
}
