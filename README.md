# 🦐 Магазин Мотыля

Современный интернет-магазин для продажи живого мотыля и коретры для рыбалки.

## 🚀 Технологический стек (2025)

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Email**: Nodemailer (SMTP)
- **Charts**: Recharts
- **Deployment**: Docker, Docker Compose, Nginx

## ✨ Возможности

### Магазин
- 🏪 Витрина с каталогом товаров
- 📦 Детальные страницы товаров с описанием и условиями хранения
- 📝 Форма заказа с отправкой заявок на email
- 📱 Адаптивный дизайн для всех устройств
- 🔍 Фильтрация по категориям (Мотыль, Коретра, Аксессуары)

### Админ-панель
- 🔐 Защищенный вход для администратора
- 📊 Аналитический дашборд с графиками
- 📈 Статистика по заявкам и выручке
- 🛍️ Управление товарами (добавление, редактирование, удаление)
- 📋 Управление заявками с изменением статусов
- 🔝 Топ продаваемых товаров
- 📧 Просмотр всех заявок с детальной информацией

### Email уведомления
- ✉️ Автоматическая отправка заявки администратору
- ✅ Подтверждение заказа клиенту
- 📄 Детальная информация о заказе в письме

### Аналитика
- 📊 Графики заявок и выручки по дням
- 💰 Средний чек
- 📈 Заявки по статусам
- 🏆 Топ товаров по продажам

## 📋 Предустановленные товары

При развертывании автоматически создаются тестовые товары:
- Мотыль крупный
- Мотыль мелкий
- Мотыль отборный (премиум)
- Коретра живая
- Коретра крупная
- Контейнер для хранения мотыля

## 🛠️ Быстрое развертывание

### Требования
- **Чистая Ubuntu VM** (20.04 или новее)
- **Доступ к SMTP серверу** (Gmail, Яндекс, и т.д.)
- **Права sudo** для установки пакетов

> ⚡ **Всё остальное установится автоматически!** Скрипт deploy.sh сам установит Docker, Docker Compose и все необходимые зависимости.

### Установка на чистой Ubuntu VM

1. **Клонируйте репозиторий** (или скопируйте файлы на VM)
```bash
git clone <repository-url>
cd motyl_shop
```

2. **Запустите скрипт развертывания**
```bash
./deploy.sh
```

### Что происходит автоматически:

Скрипт **deploy.sh** полностью автоматизирует весь процесс:

**Шаг 1: Проверка и установка зависимостей**
- ✅ Проверяет наличие git, curl, openssl
- ✅ Устанавливает недостающие пакеты
- ✅ Проверяет наличие Docker
- ✅ **Автоматически устанавливает Docker** если его нет (с вашего разрешения)
- ✅ **Автоматически устанавливает Docker Compose** если его нет
- ✅ Запускает Docker daemon
- ✅ Добавляет текущего пользователя в группу docker

**Шаг 2: Генерация SSL сертификата**
- Создаёт самоподписной сертификат для вашего домена

**Шаг 3: Настройка окружения**
- Интерактивно запрашивает SMTP настройки
- Создаёт файл `.env` с конфигурацией

**Шаг 4: Запуск приложения**
- Собирает Docker образы
- Запускает все контейнеры (PostgreSQL, App, Nginx)
- Создаёт базу данных
- Заполняет тестовыми товарами

3. **Введите данные при запросе**
- Доменное имя (например, `motyl-shop.local`)
- SMTP настройки (хост, порт, логин, пароль)
- Email администратора для уведомлений
- Пароль для админ-панели

### Готово!

После завершения скрипта:
- 🌐 Магазин доступен по адресу: `https://ваш-домен`
- 🔐 Админ-панель: `https://ваш-домен/admin`
- 📧 Email для входа: тот, что указали при установке
- 🔑 Пароль: тот, что указали при установке

## 🔧 Ручная настройка (опционально)

### 1. Создайте .env файл

```bash
cp .env.example .env
```

### 2. Настройте переменные окружения

Отредактируйте `.env`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
ADMIN_EMAIL=admin@example.com

# Admin Account
ADMIN_PASSWORD=secure-password-here

# NextAuth
NEXTAUTH_SECRET=generate-random-32-char-string
NEXTAUTH_URL=https://your-domain.com

# Domain
DOMAIN=your-domain.com
```

### 3. Сгенерируйте SSL сертификат

```bash
cd cert
../generate-cert.sh your-domain.com
cd ..
```

### 4. Запустите Docker контейнеры

```bash
docker-compose up -d --build
```

## 📧 Настройка SMTP

### Gmail
1. Включите двухфакторную аутентификацию
2. Создайте пароль приложения: https://myaccount.google.com/apppasswords
3. Используйте этот пароль в `SMTP_PASSWORD`

### Яндекс
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=your-email@yandex.ru
SMTP_PASSWORD=your-password
```

### Mail.ru
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_USER=your-email@mail.ru
SMTP_PASSWORD=your-password
```

## 🔒 SSL Сертификаты

### Самоподписной сертификат (для тестирования)

Автоматически генерируется скриптом `deploy.sh`.

Чтобы браузер доверял сертификату:
1. Скачайте `cert/rootCA.pem`
2. Импортируйте его в систему как доверенный корневой CA

### Настоящий сертификат (для продакшена)

#### Вариант 1: Let's Encrypt (бесплатно)

```bash
# Установите certbot
apt-get install certbot

# Получите сертификат
certbot certonly --standalone -d your-domain.com

# Скопируйте сертификаты
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem cert/fullchain.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem cert/private.key

# Перезапустите nginx
docker-compose restart nginx
```

#### Вариант 2: Коммерческий CA

1. Получите сертификат от вашего CA
2. Положите файлы в папку `cert/`:
   - `fullchain.crt` - полная цепочка сертификатов
   - `private.key` - приватный ключ
3. Перезапустите nginx: `docker-compose restart nginx`

## 🎯 Управление приложением

### Просмотр логов
```bash
# Все контейнеры
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f nginx
```

### Остановка
```bash
docker-compose down
```

### Перезапуск
```bash
docker-compose restart
```

### Обновление
```bash
git pull
docker-compose up -d --build
```

### Резервное копирование базы данных
```bash
docker-compose exec postgres pg_dump -U motyluser motylshop > backup.sql
```

### Восстановление базы данных
```bash
docker-compose exec -T postgres psql -U motyluser motylshop < backup.sql
```

## 📁 Структура проекта

```
motyl_shop/
├── app/                    # Next.js App Router
│   ├── admin/             # Админ-панель
│   ├── api/               # API маршруты
│   ├── catalog/           # Каталог товаров
│   ├── product/           # Страница товара
│   ├── about/             # О компании
│   ├── contacts/          # Контакты
│   └── delivery/          # Доставка и оплата
├── components/            # React компоненты
├── lib/                   # Утилиты и библиотеки
├── prisma/               # Схема БД и сиды
├── nginx/                # Конфигурация Nginx
├── cert/                 # SSL сертификаты
├── docker-compose.yml    # Docker Compose конфигурация
├── Dockerfile            # Docker образ приложения
└── deploy.sh             # Скрипт развертывания
```

## 🗄️ База данных

### Модели
- `Product` - Товары
- `Order` - Заявки
- `OrderItem` - Позиции в заявке
- `Admin` - Администраторы

### Prisma команды
```bash
# Применить изменения схемы
docker-compose exec app npx prisma db push

# Заполнить тестовыми данными
docker-compose exec app npx prisma db seed

# Открыть Prisma Studio
docker-compose exec app npx prisma studio
```

## 🔍 Устранение неполадок

### Проблемы с email
- Проверьте правильность SMTP настроек
- Убедитесь, что используете пароль приложения (для Gmail)
- Проверьте логи: `docker-compose logs app`

### Проблемы с SSL
- Убедитесь, что сертификаты находятся в папке `cert/`
- Проверьте права доступа к файлам сертификатов
- Для самоподписного сертификата импортируйте `rootCA.pem`

### Проблемы с подключением к БД
- Проверьте, что контейнер postgres запущен: `docker-compose ps`
- Проверьте логи postgres: `docker-compose logs postgres`
- Убедитесь, что `DATABASE_URL` в `.env` корректен

### Порты заняты
Если порты 80 или 443 заняты, измените их в `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # HTTP на порту 8080
  - "8443:443"   # HTTPS на порту 8443
```

## 🎨 Кастомизация

### Изменение цветовой схемы
Отредактируйте `tailwind.config.ts` и `app/globals.css`

### Добавление новых товаров
1. Через админ-панель: `/admin/products`
2. Или отредактируйте `prisma/seed.ts`

### Изменение email шаблона
Отредактируйте `lib/email.ts`

## 📝 Лицензия

Этот проект создан для демонстрационных целей.

## 🤝 Поддержка

Для вопросов и предложений создайте issue в репозитории.

---

**Разработано в 2025 году с использованием современных технологий**
