# MafStat - Сервер Express

Бэкенд-сервер для приложения MafStat, реализованный с использованием Express, TypeScript, Prisma ORM и PostgreSQL.

## Технологии

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT аутентификация
- Bcrypt для шифрования паролей

## Требования

- Node.js (версия 16+)
- PostgreSQL база данных
- pnpm (рекомендуется) или npm

## Установка

1. Клонируйте репозиторий:
```bash
git clone <URL репозитория>
cd mafstat2/server
```

2. Установите зависимости:
```bash
pnpm install
# или
npm install
```

3. Создайте файл `.env` в корне проекта server и добавьте необходимые переменные окружения (пример ниже).

4. Сгенерируйте клиент Prisma:
```bash
pnpm prisma:generate
# или
npm run prisma:generate
```

5. Примените миграции базы данных:
```bash
pnpm prisma:migrate
# или
npm run prisma:migrate
```

## Переменные окружения

Создайте файл `.env` в корне папки `server` со следующими переменными:

```env
# Сервер
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# База данных
DATABASE_URL=postgresql://username:password@localhost:5432/mafstat?schema=public
DATABASE_URL_UNPOOLED=postgresql://username:password@localhost:5432/mafstat?schema=public&connection_limit=1

# CORS
CLIENT_URL=http://localhost:3000
```

## Запуск сервера

### Режим разработки
```bash
pnpm dev
# или
npm run dev
```

### Режим production
```bash
pnpm build
pnpm start
# или
npm run build
npm start
```

## Структура проекта

```
server/
├── prisma/
│   └── schema.prisma       # Схема базы данных Prisma
├── src/
│   ├── config/             # Конфигурация приложения
│   ├── controllers/        # Контроллеры для обработки запросов
│   ├── middlewares/        # Middleware (аутентификация и др.)
│   ├── routes/             # API маршруты
│   ├── utils/              # Утилиты и вспомогательные функции
│   ├── app.ts              # Настройка Express приложения
│   └── server.ts           # Входная точка сервера
├── .env                    # Переменные окружения
├── package.json            # Зависимости и скрипты
└── tsconfig.json           # Конфигурация TypeScript
```

## API Endpoints

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/refresh-token` - Обновление токена доступа
- `POST /api/auth/logout` - Выход из системы
- `GET /api/auth/profile` - Получение профиля пользователя (требует аутентификации)

### Игры

- `GET /api/games` - Получение списка всех игр
- `GET /api/games/:id` - Получение информации об игре по ID
- `POST /api/games` - Создание новой игры (требует аутентификации)
- `PUT /api/games/:id` - Обновление игры (требует прав)
- `DELETE /api/games/:id` - Удаление игры (требует прав)
- `POST /api/games/:id/results` - Добавление результатов игры (требует прав)

## База данных

Схема базы данных включает следующие модели:

- `User` - Пользователи (игроки, ведущие)
- `Game` - Игры мафии
- `GameResult` - Результаты игр
- `RefreshToken` - Токены обновления для аутентификации

Для просмотра и редактирования базы данных в GUI можно использовать Prisma Studio:

```bash
pnpm prisma:studio
# или
npm run prisma:studio
```

## Дополнительные команды

- `pnpm build` - Компиляция TypeScript кода
- `pnpm start` - Запуск скомпилированного сервера
- `pnpm prisma:generate` - Генерация клиента Prisma
- `pnpm prisma:migrate` - Применение миграций базы данных
- `pnpm prisma:studio` - Запуск Prisma Studio
