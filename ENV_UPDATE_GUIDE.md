# Инструкция по обновлению .env файла

## Шаг 1: Сгенерируйте безопасные секреты

Выполните команды для генерации случайных секретов:

```bash
# Сгенерировать NEXTAUTH_SECRET (для JWT подписи)
openssl rand -base64 32

# Сгенерировать KEYCLOAK_CLIENT_SECRET
openssl rand -base64 32

# Сгенерировать KEYCLOAK_ADMIN_PASSWORD
openssl rand -base64 24
```

Сохраните эти значения - они понадобятся на следующем шаге.

---

## Шаг 2: Добавьте новые переменные в .env

Откройте ваш `.env` файл и **добавьте** эти строки:

```env
# ============================================
# KEYCLOAK CONFIGURATION
# ============================================

# URL Keycloak (внутри Docker)
KEYCLOAK_URL=http://keycloak:8080

# Название realm в Keycloak
KEYCLOAK_REALM=motyl-shop

# Client ID для приложения
KEYCLOAK_CLIENT_ID=motyl-admin

# Client Secret (используйте сгенерированное значение)
KEYCLOAK_CLIENT_SECRET=вставьте_сюда_результат_openssl_rand

# Пароль администратора Keycloak
KEYCLOAK_ADMIN_PASSWORD=вставьте_сюда_пароль_администратора

# ============================================
# JWT / SECURITY
# ============================================

# Secret для подписи JWT токенов (используйте сгенерированное значение)
NEXTAUTH_SECRET=вставьте_сюда_результат_openssl_rand
```

---

## Шаг 3: Обновите существующие переменные (опционально)

Если вы обновляете существующий проект, убедитесь что эти переменные установлены:

```env
# NextAuth URL (замените на ваш домен)
NEXTAUTH_URL=https://motyl-shop.ru

# Домен для SSL сертификата
DOMAIN=motyl-shop.ru
```

---

## Шаг 4: Полный пример .env файла

Вот как должен выглядеть ваш `.env` файл после обновления:

```env
# Database
DATABASE_URL="postgresql://motyluser:motylpass@localhost:5432/motylshop"

# SMTP Configuration
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_USER=ваш-email@mail.ru
SMTP_PASSWORD=ваш-пароль-приложения
SMTP_FROM=ваш-email@mail.ru

# Admin Account (legacy)
ADMIN_EMAIL=admin@motyl-shop.ru
ADMIN_PASSWORD=временный-пароль-123

# Keycloak Configuration
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=motyl-shop
KEYCLOAK_CLIENT_ID=motyl-admin
KEYCLOAK_CLIENT_SECRET=fK8vNm2pQr5sT9wXzY3aB6cD1eH4gJ7l
KEYCLOAK_ADMIN_PASSWORD=SecureAdminPass123!

# NextAuth / JWT Security
NEXTAUTH_SECRET=aB3dE5fG7hJ9kL2mN4pQ6rS8tU1vW3xY5zA7bC9dE2f
NEXTAUTH_URL=https://motyl-shop.ru

# Domain for SSL certificate
DOMAIN=motyl-shop.ru
```

---

## Шаг 5: Применение изменений

После обновления `.env` файла:

### Вариант А: Пересборка контейнеров (рекомендуется)

```bash
# Остановить все контейнеры
docker compose down

# Пересобрать с новыми переменными
docker compose up -d --build
```

### Вариант Б: Перезапуск без пересборки

```bash
# Перезапустить контейнеры
docker compose restart
```

---

## Шаг 6: Инициализация Keycloak

После запуска контейнеров нужно настроить Keycloak:

```bash
# 1. Дождитесь готовности Keycloak (может занять 1-2 минуты)
docker logs -f motyl_keycloak

# Ждите сообщение: "Keycloak is ready"
# Остановите просмотр логов: Ctrl+C

# 2. Запустите скрипт инициализации
docker exec -it motyl_app bash /app/scripts/init-keycloak.sh

# Вы увидите:
# ✅ Keycloak initialization completed successfully!
```

---

## Шаг 7: Создание первого пользователя Keycloak

### Вариант А: Через Keycloak Admin Console

1. Откройте: http://localhost:8080/admin (или https://motyl-shop.ru:8080/admin)
2. Логин: `admin`
3. Пароль: значение из `KEYCLOAK_ADMIN_PASSWORD`
4. В левом верхнем углу выберите realm: **motyl-shop**
5. Перейдите: **Users** → **Add user**
6. Заполните:
   - **Email**: ваш email
   - **Email verified**: включите
   - **Enabled**: включите
7. Нажмите **Create**
8. Перейдите на вкладку **Credentials**
9. Нажмите **Set password**:
   - Password: ваш пароль (минимум 8 символов)
   - Temporary: **выключите**
10. Нажмите **Save**
11. Перейдите на вкладку **Role mappings**
12. Нажмите **Assign role**
13. Выберите **super-admin**
14. Нажмите **Assign**

### Вариант Б: Через админку Motyl Shop

1. Войдите в существующий аккаунт Super Admin
2. Перейдите: https://motyl-shop.ru/admin/keycloak-users
3. Нажмите **"Добавить пользователя"**
4. Заполните:
   - Email: новый email
   - Пароль: минимум 8 символов
   - Имя / Фамилия (опционально)
   - Роль: Super Admin
5. Нажмите **"Создать"**

---

## Шаг 8: Проверка работы

Проверьте, что авторизация работает через Keycloak:

```bash
# 1. Откройте админку
https://motyl-shop.ru/admin/login

# 2. Войдите с созданным пользователем
# Email: ваш email из Keycloak
# Пароль: установленный пароль

# 3. Вы должны успешно войти в админку
```

Если вход успешен - всё настроено правильно! 🎉

---

## ❓ Troubleshooting

### Проблема: "Keycloak authentication failed"

**Решение:**
```bash
# Проверьте логи Keycloak
docker logs motyl_keycloak

# Убедитесь что Keycloak запущен
docker ps | grep keycloak

# Перезапустите Keycloak
docker compose restart keycloak
```

### Проблема: "Invalid or expired token"

**Решение:**
- Проверьте что `NEXTAUTH_SECRET` одинаковый во всех контейнерах
- Очистите cookies браузера
- Перелогиньтесь

### Проблема: "Client not found"

**Решение:**
```bash
# Повторно запустите инициализацию Keycloak
docker exec -it motyl_app bash /app/scripts/init-keycloak.sh
```

### Проблема: "Too many login attempts"

**Решение:**
- Подождите 1 минуту (rate limit)
- Или очистите rate limit кеш:
```bash
docker compose restart app
```

---

## 🔒 Важные замечания по безопасности

1. **НИКОГДА** не коммитьте `.env` файл в git
2. **Используйте разные секреты** для development и production
3. **Сгенерируйте новые секреты** при каждом развертывании
4. **Храните секреты безопасно** (используйте password manager)
5. В production **включите HTTPS** для Keycloak

---

## 📝 Что изменилось

**Новое:**
- ✅ Авторизация через Keycloak (OAuth2)
- ✅ JWT токены вместо простых cookies
- ✅ Rate limiting (5 попыток/минуту)
- ✅ Все API защищены
- ✅ Централизованное управление пользователями

**Старое (удалено):**
- ❌ Локальная авторизация через БД (заменена на Keycloak)
- ❌ Незащищенные cookies admin_id

**Совместимость:**
- Старые cookies сохранены для UI (`admin-session`, `admin_id`)
- Можно использовать существующих админов из БД (но рекомендуется перенести в Keycloak)
