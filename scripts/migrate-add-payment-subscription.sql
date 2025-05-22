-- Создание типов для перечислений
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'MONTHLY', 'YEARLY', 'PREMIUM');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED');

-- Создание таблицы Product, если она еще не существует
CREATE TABLE IF NOT EXISTS "products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" FLOAT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Создание таблицы Subscription
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "plan" "UserPlan" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "stripeSubscriptionId" TEXT UNIQUE,
  "stripePriceId" TEXT,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "endDate" TIMESTAMP WITH TIME ZONE,
  "canceledAt" TIMESTAMP WITH TIME ZONE,
  "trialEndsAt" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Создание таблицы Payment
CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT PRIMARY KEY,
  "amount" FLOAT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "stripeSessionId" TEXT UNIQUE,
  "stripeCustomerId" TEXT,
  "stripePaymentIntentId" TEXT,
  "subscriptionId" TEXT,
  "paymentType" TEXT NOT NULL DEFAULT 'one-time',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "userId" TEXT NOT NULL,
  "productId" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "products"("id"),
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
);

-- Добавление поля plan в таблицу users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" "UserPlan" NOT NULL DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "planUpdatedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "premium_nights" INTEGER DEFAULT 0;

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS "idx_payments_userId" ON "payments"("userId");
CREATE INDEX IF NOT EXISTS "idx_payments_productId" ON "payments"("productId");
CREATE INDEX IF NOT EXISTS "idx_payments_subscriptionId" ON "payments"("subscriptionId");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_userId" ON "subscriptions"("userId");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripeSubscriptionId" ON "subscriptions"("stripeSubscriptionId");
