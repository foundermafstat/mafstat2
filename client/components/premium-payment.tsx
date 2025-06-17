'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Elements,
	PaymentElement,
	useStripe,
	useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { getStripe, premiumPlans } from '@/lib/stripe-client';
import type { PremiumPlan } from '@/lib/stripe-client';
import { Loader2 } from 'lucide-react';

// Инициализация Stripe
const stripePromise = getStripe();

interface PremiumPaymentProps {
	userId: string;
}

// Компонент формы оплаты, обернутый в Elements
function CheckoutForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
	const stripe = useStripe();
	const elements = useElements();
	const [isPaying, setIsPaying] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) return;

		setIsPaying(true);
		setErrorMessage(null);

		try {
			const { error, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: `${window.location.origin}/profile?payment_success=true`,
				},
				redirect: 'if_required',
			});

			if (error) {
				setErrorMessage(
					error.message || 'Произошла ошибка при обработке платежа'
				);
			} else if (paymentIntent?.status === 'succeeded') {
				await onSuccess();
			}
		} catch (err) {
			console.error('Ошибка платежа:', err);
			setErrorMessage('Произошла непредвиденная ошибка');
		} finally {
			setIsPaying(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<PaymentElement />
			{errorMessage && (
				<div className="p-2 text-sm text-red-600 bg-red-50 rounded-md">
					{errorMessage}
				</div>
			)}
			<Button type="submit" disabled={!stripe || isPaying} className="w-full">
				{isPaying ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Обработка платежа...
					</>
				) : (
					`Оплатить`
				)}
			</Button>
		</form>
	);
}

export function PremiumPayment({ userId }: PremiumPaymentProps) {
	const [loading, setLoading] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)
	const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isPremium, setIsPremium] = useState(false);
	const [premiumNights, setPremiumNights] = useState(0);

	const loadPremiumStatus = useCallback(async () => {
		try {
			const response = await fetch('/api/user/premium-status');
			if (response.ok) {
				const data = await response.json();
				setIsPremium(data.isPremium);
				setPremiumNights(data.nightsRemaining);
			}
		} catch (error) {
			console.error('Ошибка загрузки премиум-статуса:', error);
		}
	}, []);

	useEffect(() => {
		loadPremiumStatus();
	}, [loadPremiumStatus]);

	const createPaymentIntent = async (planId: string) => {
		setIsLoading(true);
		try {
			const response = await fetch('/api/payments/create-intent', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planId }),
			});
			if (!response.ok) throw new Error('Не удалось создать платеж');
			const data = await response.json();
			setClientSecret(data.clientSecret);
		} catch (error) {
			console.error('Ошибка создания платежа:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePaymentSuccess = async () => {
		await loadPremiumStatus();
		setSelectedPlan(null);
		setClientSecret(null);
	};

	// Обработка покупки премиум-плана
	const handlePurchase = async (planId: 'premium-4' | 'premium-8') => {
		setLoading(true);
		setError(null);

		try {
			const result = await createPremiumCheckout({ planId });

			if (result.error) {
				setError(result.error);
			} else if (result.url) {
				const url = new URL(result.url);
				url.searchParams.append('plan_id', planId);

				window.location.href = url.toString();
				return;
			}
		} catch (e) {
			console.error('Ошибка при создании платежа:', e);
			const errorMessage =
				typeof e === 'object' && e !== null && 'message' in e
					? String(e.message)
					: 'Не удалось создать платеж';
			setError(errorMessage);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-primary/10 p-4 rounded-lg">
				<h3 className="text-lg font-medium mb-2">Ваш премиум-статус</h3>
				{isPremium ? (
					<div>
						<p className="mb-2">У вас активирован премиум-статус</p>
						<p className="text-sm">
							Осталось игровых вечеров:{' '}
							<span className="font-bold">{premiumNights}</span>
						</p>
					</div>
				) : (
					<p>У вас нет активированного премиум-статуса</p>
				)}
			</div>

			{clientSecret && selectedPlan ? (
				<Card>
					<CardHeader>
						<CardTitle>Оплата премиум-статуса</CardTitle>
						<CardDescription>{selectedPlan.description}</CardDescription>
					</CardHeader>
					<CardContent>
						<Elements
							stripe={stripePromise}
							options={{
								clientSecret,
								appearance: { theme: 'stripe' },
							}}
						>
							<CheckoutForm onSuccess={handlePaymentSuccess} />
						</Elements>
					</CardContent>
					<CardFooter>
						<Button variant="outline" onClick={() => setSelectedPlan(null)}>
							Назад к выбору плана
						</Button>
					</CardFooter>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{premiumPlans.map((plan) => (
						<Card key={plan.id}>
							<CardHeader>
								<CardTitle>{plan.name}</CardTitle>
								<CardDescription>{plan.description}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-3xl font-bold mb-4">{plan.price} ₽</div>
								<ul className="space-y-2 text-sm">
									<li>✓ {plan.nights} игровых вечеров</li>
									<li>✓ Расширенная статистика</li>
									<li>✓ Персональные рекомендации</li>
								</ul>
							</CardContent>
							<CardFooter>
								<Button
									onClick={() => {
										setSelectedPlan(plan);
										createPaymentIntent(plan.id);
									}}
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Загрузка...
										</>
									) : (
										'Выбрать план'
									)}
								</Button>
								<Button
									className="w-full"
									onClick={() =>
										handlePurchase(plan.id as 'premium-4' | 'premium-8')
									}
									disabled={loading || checkingPayment}
								>
									{loading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Обработка...
										</>
									) : (
										`Купить за ${plan.price} ₽`
									)}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
