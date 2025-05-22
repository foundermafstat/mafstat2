-- Добавление полей для премиум-функционала в таблицу users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(50) DEFAULT 'user';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "premium_nights" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "planUpdatedAt" TIMESTAMP WITH TIME ZONE;

-- Обновление существующих пользователей
UPDATE "users" SET "role" = 'user' WHERE "role" IS NULL;
UPDATE "users" SET "premium_nights" = 0 WHERE "premium_nights" IS NULL;

-- Создание индекса для ускорения поиска по роли
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");
