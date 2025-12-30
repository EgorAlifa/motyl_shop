import bcrypt from 'bcrypt'
import { prisma } from './prisma'

export async function verifyAdmin(email: string, password: string): Promise<boolean> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    if (!admin) {
      return false
    }

    return await bcrypt.compare(password, admin.password)
  } catch (error) {
    console.error('Auth error:', error)
    return false
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
