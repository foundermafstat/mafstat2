'use server';

import Stripe from 'stripe';

// Инициализация Stripe только на серверной стороне через асинхронную функцию
export async function getStripe(): Promise<Stripe> {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '');
}

// Типы для обработки премиум-статуса
export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  priceId: string;
  price: number;
  nights: number;
}

// Асинхронная функция для получения премиум-планов
export async function getPremiumPlans(): Promise<PremiumPlan[]> {
  return [
    {
      id: 'premium-4',
      name: 'Премиум 4 вечера',
      description: '4 игровых вечера с расширенной статистикой',
      priceId: process.env.STRIPE_PRICE_ID_4_NIGHTS || '',
      price: 2000, // 2000 рублей
      nights: 4,
    },
    {
      id: 'premium-8',
      name: 'Премиум 8 вечеров',
      description: '8 игровых вечера с расширенной статистикой',
      priceId: process.env.STRIPE_PRICE_ID_8_NIGHTS || '',
      price: 3600, // 3600 рублей
      nights: 8,
    }
  ];
}

// Функция для получения плана по ID
export async function getPremiumPlanById(planId: string): Promise<PremiumPlan | undefined> {
  const plans = await getPremiumPlans();
  return plans.find(plan => plan.id === planId);
}
