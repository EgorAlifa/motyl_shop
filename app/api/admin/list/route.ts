import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withSuperAdmin } from '@/lib/api-auth'

export const GET = withSuperAdmin(async (request: NextRequest) => {
  try {

    // Получаем всех админов
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isBlocked: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(admins)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка администраторов' },
      { status: 500 }
    )
  }
})
