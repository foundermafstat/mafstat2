import { prisma } from '../utils/db';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

export class PaymentService {
  // Получение всех платежей
  static async getAllPayments() {
    return prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
        subscription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение платежей пользователя
  static async getUserPayments(userId: number) {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        product: true,
        subscription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Получение платежа по ID
  static async getPaymentById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
        subscription: true,
      },
    });
  }

  // Создание платежа
  static async createPayment(data: {
    userId: number;
    amount: number;
    currency?: string;
    status?: string;
    paymentMethod?: string;
    description?: string;
    externalId?: string;
    metadata?: any;
    productId?: string;
    paymentType?: string;
  }) {
    return prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod,
        description: data.description,
        externalId: data.externalId,
        metadata: data.metadata,
        productId: data.productId,
        paymentType: data.paymentType || 'one-time',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
      },
    });
  }

  // Обновление платежа
  static async updatePayment(id: string, data: {
    amount?: number;
    currency?: string;
    status?: string;
    paymentMethod?: string;
    description?: string;
    externalId?: string;
    metadata?: any;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    stripeCustomerId?: string;
  }) {
    const updateData: any = {};

    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.externalId !== undefined) updateData.externalId = data.externalId;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.stripeSessionId !== undefined) updateData.stripeSessionId = data.stripeSessionId;
    if (data.stripePaymentIntentId !== undefined) updateData.stripePaymentIntentId = data.stripePaymentIntentId;
    if (data.stripeCustomerId !== undefined) updateData.stripeCustomerId = data.stripeCustomerId;

    return prisma.payment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: true,
      },
    });
  }

  // Удаление платежа
  static async deletePayment(id: string) {
    return prisma.payment.delete({
      where: { id },
    });
  }

  // Создание checkout сессии для подписки
  static async createCheckoutSession(data: {
    userId: number;
    userEmail: string;
    planId: 'monthly' | 'yearly';
  }) {
    const planConfig = {
      monthly: {
        name: 'Ежемесячная подписка Perfect Pitcher',
        description: 'Доступ к полному функционалу Perfect Pitcher на 1 месяц',
        price: 9.99,
        interval: 'month' as const,
        interval_count: 1,
      },
      yearly: {
        name: 'Годовая подписка Perfect Pitcher',
        description: 'Доступ к полному функционалу Perfect Pitcher на 1 год (2 месяца бесплатно)',
        price: 99.99,
        interval: 'year' as const,
        interval_count: 1,
      },
    }[data.planId];

    // Создаем платеж в базе данных
    const payment = await prisma.payment.create({
      data: {
        amount: planConfig.price,
        currency: 'USD',
        status: 'pending',
        paymentType: 'subscription',
        userId: data.userId,
      },
    });

    // Создаем сессию Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: Math.round(planConfig.price * 100),
            recurring: {
              interval: planConfig.interval,
              interval_count: planConfig.interval_count,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
      metadata: {
        paymentId: payment.id,
        userId: data.userId.toString(),
        planId: data.planId,
      },
      customer_email: data.userEmail || undefined,
    });

    // Обновляем платеж с ID сессии Stripe
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripeSessionId: stripeSession.id,
        stripePaymentIntentId: stripeSession.payment_intent as string || null,
      },
    });

    return { url: stripeSession.url, sessionId: stripeSession.id };
  }

  // Проверка статуса платежа
  static async checkPaymentStatus(sessionId: string) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (!checkoutSession) {
      throw new Error('Сессия не найдена');
    }

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
    });

    if (!payment) {
      throw new Error('Платеж не найден в базе данных');
    }

    if (checkoutSession.payment_status === 'paid') {
      // Обновляем статус платежа
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          stripePaymentIntentId: checkoutSession.payment_intent as string,
        },
      });

      // Если это подписка, создаем запись о подписке
      if (checkoutSession.mode === 'subscription' && checkoutSession.subscription) {
        const planId = checkoutSession.metadata?.planId as 'monthly' | 'yearly';
        const userId = payment.userId;

        const subscription = await prisma.subscription.create({
          data: {
            userId,
            plan: planId === 'monthly' ? 'MONTHLY' : 'YEARLY',
            stripeSubscriptionId: checkoutSession.subscription as string,
            stripePriceId: checkoutSession.metadata?.priceId as string,
            startDate: new Date(),
            endDate: planId === 'monthly'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            subscriptionId: subscription.id,
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planId === 'monthly' ? 'MONTHLY' : 'YEARLY',
            planUpdatedAt: new Date(),
          },
        });

        return {
          success: true,
          subscription,
          message: 'Подписка успешно оформлена',
        };
      }

      return { success: true, message: 'Платеж успешно обработан' };
    }

    return {
      success: false,
      status: checkoutSession.payment_status,
      message: 'Платеж не завершен',
    };
  }

  // Отмена подписки
  static async cancelSubscription(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (!user.subscriptions.length) {
      throw new Error('Активная подписка не найдена');
    }

    const subscription = user.subscriptions[0];

    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (error) {
        console.error('Ошибка при отмене подписки в Stripe:', error);
      }
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: 'FREE',
        planUpdatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Подписка успешно отменена. По окончании оплаченного периода вы будете переведены на бесплатный план.',
    };
  }
}

