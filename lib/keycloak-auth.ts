import { getKeycloakAdmin, createSessionToken } from './keycloak'

export interface LoginResult {
  success: boolean
  admin?: {
    id: string
    name: string
    email: string
    role: string
    permissions: string[]
  }
  token?: string
  error?: string
}

/**
 * Авторизация пользователя через Keycloak
 */
export async function loginWithKeycloak(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const kcAdmin = await getKeycloakAdmin()

    // Получаем токен для пользователя
    const tokenResponse = await fetch(
      `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: process.env.KEYCLOAK_CLIENT_ID || 'motyl-admin',
          client_secret: process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret',
          username: email,
          password: password,
          scope: 'openid email profile',
        }),
      }
    )

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json()
      return {
        success: false,
        error: error.error_description || 'Неверный email или пароль',
      }
    }

    const tokenData = await tokenResponse.json()

    // Получаем информацию о пользователе
    const users = await kcAdmin.users.find({ email })

    if (users.length === 0) {
      return {
        success: false,
        error: 'Пользователь не найден',
      }
    }

    const user = users[0]

    // Проверяем, активен ли пользователь
    if (!user.enabled) {
      return {
        success: false,
        error: 'Аккаунт заблокирован',
      }
    }

    // Получаем роли пользователя
    const userRoles = await kcAdmin.users.listRealmRoleMappings({ id: user.id! })

    const role = userRoles.find((r) => r.name === 'super-admin')
      ? 'SUPER_ADMIN'
      : 'ADMIN'

    const permissions: string[] = []

    // Определяем permissions на основе ролей
    if (role === 'SUPER_ADMIN') {
      permissions.push('dashboard', 'products', 'orders', 'admins', 'keycloak')
    } else {
      // Для обычных админов читаем permissions из attributes
      const userPermissions = user.attributes?.permissions || []
      permissions.push(...userPermissions)
    }

    // Создаем JWT токен для нашего приложения
    const appToken = await createSessionToken({
      id: user.id!,
      email: user.email!,
      role: role,
      permissions: permissions,
    })

    return {
      success: true,
      admin: {
        id: user.id!,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || email,
        email: user.email!,
        role: role,
        permissions: permissions,
      },
      token: appToken,
    }
  } catch (error: any) {
    console.error('Keycloak login error:', error)
    return {
      success: false,
      error: 'Ошибка при входе через Keycloak',
    }
  }
}

/**
 * Проверка токена Keycloak и получение данных пользователя
 */
export async function verifyKeycloakSession(userId: string): Promise<{
  valid: boolean
  user?: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
}> {
  try {
    const kcAdmin = await getKeycloakAdmin()

    const user = await kcAdmin.users.findOne({ id: userId })

    if (!user || !user.enabled) {
      return { valid: false }
    }

    const userRoles = await kcAdmin.users.listRealmRoleMappings({ id: userId })

    const role = userRoles.find((r) => r.name === 'super-admin')
      ? 'SUPER_ADMIN'
      : 'ADMIN'

    const permissions: string[] = []

    if (role === 'SUPER_ADMIN') {
      permissions.push('dashboard', 'products', 'orders', 'admins', 'keycloak')
    } else {
      const userPermissions = user.attributes?.permissions || []
      permissions.push(...userPermissions)
    }

    return {
      valid: true,
      user: {
        id: user.id!,
        email: user.email!,
        role: role,
        permissions: permissions,
      },
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return { valid: false }
  }
}
