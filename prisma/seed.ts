import { PrismaClient, Category } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create super admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.ru'
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      // Обновляем role на SUPER_ADMIN если уже существует
      role: 'SUPER_ADMIN',
      permissions: ['dashboard', 'products', 'orders', 'admins'],
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Главный администратор',
      role: 'SUPER_ADMIN',
      permissions: ['dashboard', 'products', 'orders', 'admins'], // Полный доступ
      isBlocked: false,
    },
  })
  console.log('Super admin created:', admin.email)

  // Create products
  const products = [
    {
      name: 'Мотыль крупный',
      slug: 'motyl-krupnyy',
      description: 'Крупный отборный мотыль для зимней рыбалки. Идеально подходит для ловли леща, плотвы, окуня. Хранится при температуре 0-4°C до 14 дней.',
      price: 350,
      stock: 5000,
      unit: 'г',
      minOrder: 50,
      category: Category.MOTYL,
      storage: 'Хранить при температуре 0-4°C в холодильнике. Не замораживать! Регулярно промывать водой. Срок хранения до 14 дней.',
      image: '/images/motyl-large.jpg',
      isActive: true,
    },
    {
      name: 'Мотыль мелкий',
      slug: 'motyl-melkiy',
      description: 'Мелкий мотыль для ловли некрупной рыбы. Отлично работает в зимний период на плотву, ерша, мелкого окуня. Хранится при температуре 0-4°C до 10 дней.',
      price: 280,
      stock: 3000,
      unit: 'г',
      minOrder: 50,
      category: Category.MOTYL,
      storage: 'Хранить при температуре 0-4°C в холодильнике. Не замораживать! Менять воду ежедневно. Срок хранения до 10 дней.',
      image: '/images/motyl-small.jpg',
      isActive: true,
    },
    {
      name: 'Мотыль отборный (премиум)',
      slug: 'motyl-premium',
      description: 'Отборный крупный мотыль премиум-класса. Самый активный и живучий мотыль для трофейной рыбалки. Хранится при температуре 0-4°C до 20 дней.',
      price: 450,
      stock: 2000,
      unit: 'г',
      minOrder: 100,
      category: Category.MOTYL,
      storage: 'Хранить при температуре 0-4°C в холодильнике в специальном контейнере. Не замораживать! Промывать каждые 2-3 дня. Срок хранения до 20 дней.',
      image: '/images/motyl-premium.jpg',
      isActive: true,
    },
    {
      name: 'Коретра живая',
      slug: 'koretra-zhivaya',
      description: 'Живая коретра (личинка комара). Прозрачная наживка для ловли капризной рыбы. Идеальна для зимней рыбалки на окуня, плотву. Хранится при температуре 0-4°C до 7 дней.',
      price: 320,
      stock: 1500,
      unit: 'г',
      minOrder: 50,
      category: Category.KORETRA,
      storage: 'Хранить при температуре 0-4°C в холодильнике в емкости с водой. Не замораживать! Менять воду ежедневно. Срок хранения до 7 дней.',
      image: '/images/koretra.jpg',
      isActive: true,
    },
    {
      name: 'Коретра крупная',
      slug: 'koretra-krupnaya',
      description: 'Крупная коретра для ловли окуня и другой хищной рыбы. Очень подвижная и привлекательная для рыбы наживка. Хранится при температуре 0-4°C до 5 дней.',
      price: 380,
      stock: 1000,
      unit: 'г',
      minOrder: 50,
      category: Category.KORETRA,
      storage: 'Хранить при температуре 0-4°C в холодильнике в емкости с чистой водой. Менять воду дважды в день. Срок хранения до 5 дней.',
      image: '/images/koretra-large.jpg',
      isActive: true,
    },
    {
      name: 'Контейнер для хранения мотыля',
      slug: 'konteyner-dlya-motylya',
      description: 'Специальный контейнер для хранения мотыля и коретры. Обеспечивает оптимальные условия хранения, продлевает жизнь наживки. Объем 500 мл.',
      price: 250,
      stock: 50,
      unit: 'шт',
      minOrder: 1,
      category: Category.ACCESSORIES,
      storage: 'Хранить в сухом месте при комнатной температуре.',
      image: '/images/container.jpg',
      isActive: true,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
