'use client';

import { loadStripe } from '@stripe/stripe-js';

// Типы для обработки премиум-статуса
export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  nights: number;
}

// Доступные планы для отображения на клиенте
// Эти значения должны соответствовать серверным в lib/stripe.ts
export const premiumPlans: PremiumPlan[] = [
  {
    id: 'premium-4',
    name: '4 Премиум вечера',
    description: '4 игровых вечера с расширенной статистикой',
    priceId: '', // ID заполняется на сервере
    price: 2000, // 2000 рублей
    nights: 4,
  },
  {
    id: 'premium-8',
    name: '8 Премиум вечеров',
    description: '8 игровых вечера с расширенной статистикой',
    priceId: '', // ID заполняется на сервере
    price: 3600, // 3600 рублей
    nights: 8,
  }
];

// Экспортируем функцию для получения Stripe объекта
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY || '');
};

// Получение плана по ID на клиенте
export const getPremiumPlanById = (planId: string): PremiumPlan | undefined => {
  return premiumPlans.find(plan => plan.id === planId);
};
