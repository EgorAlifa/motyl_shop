import KcAdminClient from '@keycloak/keycloak-admin-client'
import { jwtVerify, SignJWT } from 'jose'

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080'
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'motyl-shop'
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'motyl-admin'
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'your-client-secret'

// Создаем singleton клиента Keycloak
let kcAdminClient: KcAdminClient | null = null

export async function getKeycloakAdmin(): Promise<KcAdminClient> {
  if (kcAdminClient) {
    return kcAdminClient
  }

  kcAdminClient = new KcAdminClient({
    baseUrl: KEYCLOAK_URL,
    realmName: KEYCLOAK_REALM,
  })

  try {
    // Авторизуемся с помощью client credentials
    await kcAdminClient.auth({
      grantType: 'client_credentials',
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
    })

    return kcAdminClient
  } catch (error) {
    console.error('Failed to authenticate with Keycloak:', error)
    throw new Error('Keycloak authentication failed')
  }
}

// Интерфейсы для работы с пользователями
export interface KeycloakUser {
  id?: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  enabled: boolean
  emailVerified?: boolean
  attributes?: Record<string, string[]>
  credentials?: Array<{
    type: string
    value: string
    temporary: boolean
  }>
}

// Создание пользователя в Keycloak
export async function createKeycloakUser(userData: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: 'admin' | 'super_admin'
}): Promise<{ id: string; username: string }> {
  try {
    const client = await getKeycloakAdmin()

    const user: KeycloakUser = {
      username: userData.email,
      email: userData.email,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      enabled: true,
      emailVerified: true,
      credentials: [
        {
          type: 'password',
          value: userData.password,
          temporary: false,
        },
      ],
      attributes: {
        role: [userData.role || 'admin'],
      },
    }

    const createdUser = await client.users.create(user)
    const userId = createdUser.id

    if (!userId) {
      throw new Error('User ID not returned from Keycloak')
    }

    // Назначаем роли
    const roles = await client.roles.find()
    const roleToAssign = userData.role === 'super_admin' ? 'super-admin' : 'admin'
    const role = roles.find((r) => r.name === roleToAssign)

    if (role && role.id) {
      await client.users.addRealmRoleMappings({
        id: userId,
        roles: [
          {
            id: role.id,
            name: role.name!,
          },
        ],
      })
    }

    return {
      id: userId,
      username: userData.email,
    }
  } catch (error: any) {
    console.error('Error creating Keycloak user:', error)
    throw new Error(error.message || 'Failed to create user in Keycloak')
  }
}

// Получение списка пользователей
export async function listKeycloakUsers(): Promise<KeycloakUser[]> {
  try {
    const client = await getKeycloakAdmin()
    const users = await client.users.find()
    return users as KeycloakUser[]
  } catch (error) {
    console.error('Error listing Keycloak users:', error)
    throw new Error('Failed to list users from Keycloak')
  }
}

// Удаление пользователя
export async function deleteKeycloakUser(userId: string): Promise<void> {
  try {
    const client = await getKeycloakAdmin()
    await client.users.del({ id: userId })
  } catch (error) {
    console.error('Error deleting Keycloak user:', error)
    throw new Error('Failed to delete user from Keycloak')
  }
}

// Обновление пользователя
export async function updateKeycloakUser(
  userId: string,
  updates: Partial<KeycloakUser>
): Promise<void> {
  try {
    const client = await getKeycloakAdmin()
    await client.users.update({ id: userId }, updates)
  } catch (error) {
    console.error('Error updating Keycloak user:', error)
    throw new Error('Failed to update user in Keycloak')
  }
}

// Сброс пароля пользователя
export async function resetKeycloakUserPassword(
  userId: string,
  newPassword: string,
  temporary: boolean = false
): Promise<void> {
  try {
    const client = await getKeycloakAdmin()
    await client.users.resetPassword({
      id: userId,
      credential: {
        type: 'password',
        value: newPassword,
        temporary,
      },
    })
  } catch (error) {
    console.error('Error resetting Keycloak user password:', error)
    throw new Error('Failed to reset password')
  }
}

// Верификация и получение данных из JWT токена
export async function verifyKeycloakToken(token: string): Promise<{
  sub: string
  email: string
  preferred_username: string
  realm_access?: { roles: string[] }
}> {
  try {
    // В production нужно использовать публичный ключ Keycloak
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

    const { payload } = await jwtVerify(token, secret)

    return payload as any
  } catch (error) {
    console.error('Token verification failed:', error)
    throw new Error('Invalid or expired token')
  }
}

// Создание JWT токена для сессии
export async function createSessionToken(user: {
  id: string
  email: string
  role: string
  permissions: string[]
}): Promise<string> {
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'your-secret-key')

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Токен действителен 7 дней
      .sign(secret)

    return token
  } catch (error) {
    console.error('Token creation failed:', error)
    throw new Error('Failed to create session token')
  }
}

// Обновление токена
export async function refreshSessionToken(oldToken: string): Promise<string> {
  try {
    const payload = await verifyKeycloakToken(oldToken)

    return createSessionToken({
      id: payload.sub,
      email: payload.email,
      role: payload.realm_access?.roles[0] || 'admin',
      permissions: payload.realm_access?.roles || [],
    })
  } catch (error) {
    console.error('Token refresh failed:', error)
    throw new Error('Failed to refresh token')
  }
}

// Authorization Code Flow: Обмен code на tokens
export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{
  access_token: string
  refresh_token: string
  id_token: string
  token_type: string
  expires_in: number
}> {
  try {
    const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[ERROR] Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        redirectUri,
      })
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    const tokens = await response.json()
    return tokens
  } catch (error: any) {
    console.error('[ERROR] Error exchanging code for tokens:', error)
    throw new Error(error.message || 'Failed to exchange authorization code')
  }
}

// Получение информации о пользователе из Keycloak по access_token
export async function getUserInfo(accessToken: string): Promise<{
  sub: string
  email: string
  email_verified: boolean
  preferred_username: string
  given_name?: string
  family_name?: string
  realm_access?: { roles: string[] }
}> {
  try {
    // Use external Keycloak URL to match token issuer
    const externalKeycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || KEYCLOAK_URL
    const userInfoUrl = `${externalKeycloakUrl}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`)
    }

    const userInfo = await response.json()
    return userInfo
  } catch (error: any) {
    console.error('Error getting user info:', error)
    throw new Error(error.message || 'Failed to get user information')
  }
}

// Декодирование access_token для получения ролей
export function decodeAccessToken(accessToken: string): {
  sub: string
  email?: string
  preferred_username?: string
  realm_access?: { roles: string[] }
  resource_access?: any
  [key: string]: any
} {
  try {
    // JWT состоит из 3 частей разделенных точкой: header.payload.signature
    const parts = accessToken.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format')
    }

    // Декодируем payload (вторая часть)
    const payload = parts[1]
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8')
    const parsed = JSON.parse(decodedPayload)

    return parsed
  } catch (error: any) {
    console.error('Error decoding access token:', error)
    throw new Error('Failed to decode access token')
  }
}

// Logout из Keycloak
export async function logoutFromKeycloak(refreshToken: string): Promise<void> {
  try {
    // Use external Keycloak URL to match token issuer
    const externalKeycloakUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || KEYCLOAK_URL
    const logoutUrl = `${externalKeycloakUrl}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`

    const response = await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        client_secret: KEYCLOAK_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      console.error('Keycloak logout failed:', response.status, response.statusText)
    } else {
      console.log('Successfully logged out from Keycloak')
    }
  } catch (error) {
    console.error('Error logging out from Keycloak:', error)
    // Не выбрасываем ошибку, так как logout должен всегда успешно завершаться на клиенте
  }
}
