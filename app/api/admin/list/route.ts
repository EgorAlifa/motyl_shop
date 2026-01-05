import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withSuperAdmin } from '@/lib/api-auth'
import { getKeycloakAdmin } from '@/lib/keycloak'

export const GET = withSuperAdmin(async (request: NextRequest) => {
  try {
    // Получаем всех админов из PostgreSQL
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

    // Получаем Keycloak Admin client
    const kcAdmin = await getKeycloakAdmin()

    // Обогащаем данные админов permissions из Keycloak
    const adminsWithKeycloakData = await Promise.all(
      admins.map(async (admin) => {
        try {
          // Ищем пользователя в Keycloak по email
          const kcUsers = await kcAdmin.users.find({
            email: admin.email,
            exact: true,
          })

          if (kcUsers && kcUsers.length > 0) {
            const kcUser = kcUsers[0]

            // Получаем permissions из атрибутов Keycloak
            const kcPermissions = kcUser.attributes?.permissions || []

            return {
              ...admin,
              permissions: kcPermissions, // Заменяем permissions из Keycloak
            }
          }
        } catch (error) {
          console.error(`Failed to fetch Keycloak data for admin ${admin.email}:`, error)
        }

        return admin
      })
    )

    return NextResponse.json(adminsWithKeycloakData)
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка администраторов' },
      { status: 500 }
    )
  }
})
