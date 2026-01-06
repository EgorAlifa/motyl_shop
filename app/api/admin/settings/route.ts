import { NextRequest, NextResponse } from 'next/server'
import { withSuperAdmin } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Схема валидации для настроек
const settingsSchema = z.object({
  notificationEmail: z.string().email().optional().nullable(),
  sendOrderConfirmation: z.boolean().optional(),
  sendStatusUpdates: z.boolean().optional(),
})

// GET /api/admin/settings - получить настройки (только для Super Admin)
export const GET = withSuperAdmin(async (request: NextRequest) => {
  try {
    // Получаем первую запись настроек (у нас должна быть только одна)
    let settings = await prisma.settings.findFirst()

    // Если настроек нет, создаем дефолтные
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          notificationEmail: process.env.ADMIN_EMAIL || null,
          sendOrderConfirmation: true,
          sendStatusUpdates: true,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[GET /api/admin/settings] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении настроек' },
      { status: 500 }
    )
  }
})

// PATCH /api/admin/settings - обновить настройки (только для Super Admin)
export const PATCH = withSuperAdmin(async (request: NextRequest) => {
  try {
    const body = await request.json()

    // Валидация данных
    const validatedData = settingsSchema.parse(body)

    // Получаем существующие настройки
    let settings = await prisma.settings.findFirst()

    if (!settings) {
      // Если настроек нет, создаем новые
      settings = await prisma.settings.create({
        data: {
          notificationEmail: validatedData.notificationEmail,
          sendOrderConfirmation: validatedData.sendOrderConfirmation ?? true,
          sendStatusUpdates: validatedData.sendStatusUpdates ?? true,
        },
      })
    } else {
      // Обновляем существующие настройки
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: validatedData,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Некорректные данные', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[PATCH /api/admin/settings] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении настроек' },
      { status: 500 }
    )
  }
})
