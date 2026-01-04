# Настройка Keycloak для Админ-панели

## ✅ Автоматическая настройка

**Хорошие новости!** Начиная с последней версии, Service Account настраивается **автоматически** при первом деплое через `./deploy.sh`.

Скрипт `scripts/init-keycloak.sh` автоматически:
- ✅ Включает Service Account для клиента `motyl-admin`
- ✅ Включает Authorization Services
- ✅ Назначает роли realm-management: `view-users`, `manage-users`, `query-users`, `view-realm`, `manage-realm`

**Вам НЕ нужно делать настройку вручную**, если вы разворачиваете проект через `./deploy.sh`!

---

## Ручная настройка (только если автоматическая не сработала)

Если по какой-то причине автоматическая настройка не сработала, или вы настраиваете Keycloak вручную:

### Шаг 1: Включение Service Account

1. Откройте Keycloak Admin Console: `http://localhost:8080/auth/admin` (или ваш URL)
2. Выберите realm `motyl-shop`
3. Перейдите в **Clients** → найдите клиент `motyl-admin`
4. Перейдите на вкладку **Settings**
5. Включите следующие опции:
   - **Service accounts enabled**: ON
   - **Authorization enabled**: ON (включится автоматически)
6. Нажмите **Save**

### Шаг 2: Назначение ролей Service Account

1. В том же клиенте `motyl-admin` перейдите на вкладку **Service Account Roles**
2. В выпадающем списке **Client Roles** выберите `realm-management`
3. В списке **Available Roles** найдите и добавьте следующие роли:
   - `view-users` (просмотр пользователей)
   - `manage-users` (управление пользователями)
   - `query-users` (поиск пользователей)
   - `view-realm` (просмотр realm)
   - `manage-realm` (управление realm) - опционально, для полного доступа

4. Нажмите **Add selected** чтобы переместить их в **Assigned Roles**

### Шаг 3: Проверка переменных окружения

Убедитесь, что в `.env.local` установлены правильные значения:

```bash
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=motyl-shop
KEYCLOAK_CLIENT_ID=motyl-admin
KEYCLOAK_CLIENT_SECRET=ваш-секретный-ключ
```

**Важно:** `KEYCLOAK_CLIENT_SECRET` можно найти в:
- **Clients** → `motyl-admin` → вкладка **Credentials** → **Client Secret**

### Шаг 4: Перезапуск приложения

После настройки Keycloak перезапустите Next.js приложение:

```bash
npm run build
npm start
```

Или через Docker:

```bash
docker-compose restart nextjs
```

---

## Проверка автоматической настройки

Чтобы убедиться, что Service Account настроен правильно:

1. Откройте Keycloak Admin Console: `https://ваш-домен/auth/admin`
2. Войдите как admin (пароль из вывода deploy.sh)
3. Выберите realm: `motyl-shop`
4. Перейдите: **Clients** → `motyl-admin`
5. Проверьте вкладку **Settings**:
   - Service accounts enabled: должно быть **ON**
   - Authorization enabled: должно быть **ON**
6. Перейдите на вкладку **Service Account Roles**
7. В выпадающем списке **Filter by clients** выберите `realm-management`
8. В **Assigned Roles** должны быть:
   - ✅ view-users
   - ✅ manage-users
   - ✅ query-users
   - ✅ view-realm
   - ✅ manage-realm

Если все галочки есть - настройка прошла успешно! ✅

## Как это работает

### Архитектура аутентификации

1. **Пользовательская аутентификация**: Админы логинятся через OAuth2 Authorization Code Flow
   - Получают `access_token` и `refresh_token` от Keycloak
   - Токены сохраняются в httpOnly cookies (`auth-token`, `kc-access-token`)
   - Middleware проверяет наличие токенов на защищенных маршрутах

2. **Авторизация в API**: API endpoints используют middleware `withSuperAdmin`
   - Проверяют валидность пользовательских токенов
   - Проверяют роль пользователя (SUPER_ADMIN, ADMIN)

3. **Управление пользователями Keycloak**: Service Account выполняет Admin API операции
   - `getKeycloakAdmin()` авторизуется через `client_credentials`
   - Использует роли `realm-management` для операций с пользователями
   - Это разделение обеспечивает безопасность: пользователи не могут напрямую манипулировать Admin API

### Почему Service Account?

Токены пользователей (даже SUPER_ADMIN) по умолчанию не имеют прав на Keycloak Admin REST API. Service Account - это специальный тип аутентификации для межсервисного взаимодействия с выделенными правами.

## Тестирование

После настройки проверьте работу:

1. Авторизуйтесь в админ-панели как SUPER_ADMIN
2. Перейдите в раздел **Администраторы** (`/admin/keycloak-users`)
3. Попробуйте:
   - Просмотреть список пользователей
   - Создать нового администратора
   - Обновить данные пользователя
   - Удалить тестового пользователя

Если видите ошибки 403/401 - проверьте, что все роли назначены правильно в Keycloak Admin Console.

## Troubleshooting

### Ошибка 403 Forbidden
**Причина:** Service Account не имеет необходимых ролей
**Решение:** Повторите Шаг 2, убедитесь что роли из `realm-management` назначены

### Ошибка 401 Unauthorized
**Причина:** Неверный `KEYCLOAK_CLIENT_SECRET` или Service Account не включен
**Решение:** Проверьте Шаг 1 и Шаг 3

### "Failed to authenticate with Keycloak"
**Причина:** Keycloak недоступен или неверные настройки подключения
**Решение:** Проверьте что Keycloak запущен и `KEYCLOAK_URL` указывает на правильный адрес

## Полезные ссылки

- [Keycloak Service Accounts Documentation](https://www.keycloak.org/docs/latest/server_admin/#_service_accounts)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/)
