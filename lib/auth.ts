import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export async function verifyAdmin(email: string, password: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    if (!admin) {
      return null
    }

    // Проверяем, не заблокирован ли админ
    if (admin.isBlocked) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return null
    }

    // Обновляем время последнего входа
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    })

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
