import nodemailer from 'nodemailer'
import { prisma } from './prisma'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true для порта 465 (SSL), false для 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // Для самоподписных сертификатов отключаем проверку
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 секунд
  greetingTimeout: 5000, // 5 секунд
  socketTimeout: 10000, // 10 секунд
})

export async function sendOrderEmail(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryAddress: string
  deliveryDate?: Date | null
  comment?: string | null
  items: Array<{
    productName: string
    quantity: number
    price: number
    unit: string
  }>
  totalAmount: number
}) {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity} ${item.unit}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.price} ₽</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity * item.price} ₽</td>
        </tr>
      `
    )
    .join('')

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Новая заявка #${order.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Новая заявка #${order.orderNumber}</h1>

        <h2 style="color: #1e40af; margin-top: 30px;">Информация о клиенте</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Имя:</td>
            <td style="padding: 8px 0;">${order.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Email:</td>
            <td style="padding: 8px 0;">${order.customerEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Телефон:</td>
            <td style="padding: 8px 0;">${order.customerPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Адрес доставки:</td>
            <td style="padding: 8px 0;">${order.deliveryAddress}</td>
          </tr>
          ${
            order.deliveryDate
              ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Дата доставки:</td>
            <td style="padding: 8px 0;">${new Date(order.deliveryDate).toLocaleDateString('ru-RU')}</td>
          </tr>
          `
              : ''
          }
          ${
            order.comment
              ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Комментарий:</td>
            <td style="padding: 8px 0;">${order.comment}</td>
          </tr>
          `
              : ''
          }
        </table>

        <h2 style="color: #1e40af; margin-top: 30px;">Состав заказа</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Товар</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Количество</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Цена</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">Итого:</td>
              <td style="padding: 15px 10px; font-weight: bold; font-size: 18px; color: #2563eb;">${order.totalAmount} ₽</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
          <p style="margin: 0;">Эта заявка отправлена автоматически из магазина мотыля.</p>
          <p style="margin: 10px 0 0 0;">Для обработки заявки войдите в админ-панель.</p>
        </div>
      </div>
    </body>
    </html>
  `

  // Получаем настройки из БД
  const settings = await prisma.settings.findFirst()
  const adminEmail = settings?.notificationEmail || process.env.ADMIN_EMAIL
  const sendOrderConfirmation = settings?.sendOrderConfirmation ?? true

  // Send to admin (если указан email)
  if (adminEmail) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmail,
      subject: `Новая заявка #${order.orderNumber} - Магазин мотыля`,
      html: emailHtml,
    })
  }

  // Send confirmation to customer (если включено в настройках)
  if (sendOrderConfirmation) {
    const customerEmailHtml = emailHtml.replace(
      'Для обработки заявки войдите в админ-панель.',
      'Мы свяжемся с вами в ближайшее время для подтверждения заказа.'
    )

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: order.customerEmail,
      subject: `Заявка #${order.orderNumber} принята - Магазин мотыля`,
      html: customerEmailHtml,
    })
  }
}

// Отправка email при смене статуса заявки
export async function sendOrderStatusUpdateEmail(order: {
  orderNumber: string
  customerName: string
  customerEmail: string
  status: string
  statusName: string
}) {
  // Получаем настройки из БД
  const settings = await prisma.settings.findFirst()
  const sendStatusUpdates = settings?.sendStatusUpdates ?? true

  // Если отправка уведомлений о статусе отключена, выходим
  if (!sendStatusUpdates) {
    return
  }

  const statusMessages: Record<string, string> = {
    NEW: 'Ваша заявка получена и ожидает обработки.',
    PROCESSING: 'Ваша заявка находится в обработке.',
    CONFIRMED: 'Ваша заявка подтверждена! Мы свяжемся с вами для уточнения деталей доставки.',
    SHIPPED: 'Ваш заказ отправлен! Ожидайте доставку.',
    DELIVERED: 'Ваш заказ доставлен! Спасибо за покупку!',
    CANCELLED: 'Ваша заявка отменена. Если у вас есть вопросы, свяжитесь с нами.',
  }

  const message = statusMessages[order.status] || 'Статус вашей заявки изменён.'

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Обновление статуса заявки #${order.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Обновление статуса заявки</h1>

        <div style="margin: 30px 0; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px;">Здравствуйте, ${order.customerName}!</p>
          <p style="margin: 15px 0 0 0; font-size: 16px;">Статус вашей заявки <strong>#${order.orderNumber}</strong> изменён на:</p>
          <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #2563eb;">${order.statusName}</p>
        </div>

        <p style="margin: 20px 0; font-size: 16px;">${message}</p>

        <div style="margin-top: 30px; padding: 15px; background-color: #f3f4f6; border-radius: 5px;">
          <p style="margin: 0;">Это письмо отправлено автоматически из магазина мотыля.</p>
          <p style="margin: 10px 0 0 0;">Если у вас есть вопросы, пожалуйста, свяжитесь с нами.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: order.customerEmail,
    subject: `Обновление заявки #${order.orderNumber} - ${order.statusName}`,
    html: emailHtml,
  })
}
