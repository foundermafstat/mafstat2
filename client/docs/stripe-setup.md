# Настройка Stripe для премиум-функционала

Для корректной работы премиум-функционала необходимо настроить Stripe и добавить несколько переменных в файл `.env`.

## Переменные окружения

```
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_*****
STRIPE_SECRET_KEY=sk_test_*****
STRIPE_WEBHOOK_SECRET=whsec_*****
STRIPE_PRICE_ID_4_NIGHTS=price_*****
STRIPE_PRICE_ID_8_NIGHTS=price_*****
```

## Шаги настройки Stripe

1. **Создание продуктов и цен в Stripe Dashboard**:
   - Войдите в [Stripe Dashboard](https://dashboard.stripe.com/)
   - Создайте продукт "Премиум 4 игровых вечера"
     - Цена: 2000 RUB
     - Запишите ID цены (`price_*****`) в `.env` как `STRIPE_PRICE_ID_4_NIGHTS`
   - Создайте продукт "Премиум 8 игровых вечеров"
     - Цена: 3600 RUB  
     - Запишите ID цены (`price_*****`) в `.env` как `STRIPE_PRICE_ID_8_NIGHTS`

2. **Настройка вебхука**:
   - В Stripe Dashboard перейдите в раздел Developers -> Webhooks
   - Добавьте endpoint: `https://ваш-домен.com/api/payments/webhook`
   - Выберите события для отслеживания:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Скопируйте Signing Secret и добавьте его в `.env` как `STRIPE_WEBHOOK_SECRET`

3. **Для локальной разработки**:
   - Используйте Stripe CLI для тестирования вебхуков
   - Запустите `stripe listen --forward-to localhost:3000/api/payments/webhook`
   - Используйте тестовые карты для проверки платежей:
     - Успешный платеж: `4242 4242 4242 4242`
     - Неудачный платеж: `4000 0000 0000 0002`

## Обновление базы данных

Для добавления поддержки премиум-статуса, выполните SQL-скрипт:

```bash
psql -h hostname -d database_name -U username -f scripts/migrate-add-premium.sql
```

## Тестирование функционала

После настройки вы сможете:
1. Видеть вкладку "Премиум" в профиле пользователя
2. Выбирать план (4 или 8 игровых вечеров)
3. Оплачивать выбранный план через Stripe
4. Проверять статус премиум-подписки
