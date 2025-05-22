'use client';

import { useAuth } from '@/hooks/use-auth';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileForm } from '@/components/profile-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { PremiumSubscription } from '@/components/premium-subscription';
import { PremiumPayment } from '@/components/premium-payment';

// Расширенный тип пользователя с полями игрока
interface ExtendedUser {
	id: string;
	name?: string | null;
	email?: string | null;
	image?: string | null;
	role?: string;
	bio?: string;
	surname?: string;
	nickname?: string;
	country?: string;
	clubId?: number | null;
	birthday?: string | Date | null;
	gender?: 'male' | 'female' | 'other' | null;
	isTournamentJudge?: boolean;
	isSideJudge?: boolean;
}

// Расширяем тип сессии
interface ExtendedSession {
	user: ExtendedUser;
	expires: string;
}

export default function ProfilePage() {
	const { session, isLoading } = useAuth() as {
		session: ExtendedSession | null;
		isLoading: boolean;
	};

	// Состояние для хранения актуальных данных пользователя
	const [userData, setUserData] = useState<ExtendedUser | null>(null);
	const [isUserDataLoading, setIsUserDataLoading] = useState(false);

	// Функция для получения актуальных данных пользователя
	const fetchUserData = async () => {
		if (!session) return;

		try {
			setIsUserDataLoading(true);
			const response = await fetch('/api/user/current');

			if (!response.ok) {
				throw new Error('Не удалось получить данные пользователя');
			}

			const data = await response.json();
			setUserData(data.user);
		} catch (error) {
			console.error('Ошибка при получении данных пользователя:', error);
		} finally {
			setIsUserDataLoading(false);
		}
	};

	// Загружаем актуальные данные при монтировании компонента
	useEffect(() => {
		if (session) {
			fetchUserData();
		}
	}, [session]);

	// Используем обертку для обновления данных пользователя
	const refreshUserData = () => {
		fetchUserData();
	};

	if (isLoading) {
		return (
			<div className="container py-6">
				<div className="animate-pulse space-y-4">
					<div className="h-8 w-64 bg-muted rounded" />
					<div className="h-64 bg-muted rounded-lg" />
				</div>
			</div>
		);
	}

	if (!session) {
		return (
			<div className="container py-6">
				<Card>
					<CardHeader>
						<CardTitle>Профиль недоступен</CardTitle>
						<CardDescription>
							Вы должны войти в систему для просмотра этой страницы
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const userInitials = userData?.name
		? userData.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
		: '?';

	return (
		<div className="container py-6 space-y-6">
			<h1 className="text-3xl font-bold">Ваш профиль</h1>
			<Tabs defaultValue="info">
				<TabsList>
					<TabsTrigger value="info">Информация</TabsTrigger>
					<TabsTrigger value="edit">Редактировать</TabsTrigger>
					<TabsTrigger value="premium">Премиум</TabsTrigger>
					<TabsTrigger value="premium-payment">Оплатить премиум</TabsTrigger>
				</TabsList>
				<TabsContent value="info">
					<Card>
						<CardHeader>
							<CardTitle>Информация о пользователе</CardTitle>
							<CardDescription>Ваши личные данные в системе</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col sm:flex-row gap-6 items-start">
								<Avatar className="h-24 w-24">
									<AvatarImage
										src={userData?.image || ''}
										alt={userData?.name || 'User'}
									/>
									<AvatarFallback className="text-2xl">
										{userInitials}
									</AvatarFallback>
								</Avatar>

								<div className="space-y-4 w-full">
									{/* Никнейм с выделением */}
									{userData?.nickname && (
										<div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
											<p className="text-sm text-muted-foreground mb-1">
												Никнейм
											</p>
											<h2 className="text-2xl font-bold text-primary">
												{userData.nickname}
											</h2>
										</div>
									)}

									{/* Основная информация */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">Имя</p>
											<p className="font-medium">
												{userData?.name || 'Не указано'}
											</p>
										</div>

										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">Фамилия</p>
											<p className="font-medium">
												{userData?.surname || 'Не указано'}
											</p>
										</div>

										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">Email</p>
											<p className="font-medium">{userData?.email}</p>
										</div>

										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">Страна</p>
											<p className="font-medium">
												{userData?.country || 'Не указано'}
											</p>
										</div>

										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">
												Дата рождения
											</p>
											<p className="font-medium">
												{userData?.birthday
													? new Date(userData.birthday).toLocaleDateString(
															'ru-RU'
													  )
													: 'Не указано'}
											</p>
										</div>

										<div className="space-y-1">
											<p className="text-sm text-muted-foreground">Пол</p>
											<p className="font-medium">
												{userData?.gender === 'male'
													? 'Мужской'
													: userData?.gender === 'female'
													? 'Женский'
													: userData?.gender === 'other'
													? 'Другой'
													: 'Не указано'}
											</p>
										</div>
									</div>

									{/* Дополнительная информация */}
									<div className="mt-2">
										<p className="text-sm text-muted-foreground mb-2">
											Статус судьи
										</p>
										<div className="flex flex-wrap gap-2">
											{userData?.isTournamentJudge && (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400">
													Судья турнира
												</span>
											)}
											{userData?.isSideJudge && (
												<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-800/30 dark:text-amber-400">
													Боковой судья
												</span>
											)}
											{!userData?.isTournamentJudge &&
												!userData?.isSideJudge && (
													<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
														Не является судьей
													</span>
												)}
										</div>
									</div>

									{/* Био */}
									{userData?.bio && (
										<div className="mt-4">
											<p className="text-sm text-muted-foreground mb-1">
												О себе
											</p>
											<div className="bg-muted/40 p-3 rounded-md">
												<p>{userData.bio}</p>
											</div>
										</div>
									)}

									{/* Роль пользователя */}
									{userData?.role && (
										<div className="flex items-center mt-2">
											<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
												{userData.role === 'admin'
													? 'Администратор'
													: 'Пользователь'}
											</span>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="edit">
					<ProfileForm user={userData} refreshUserData={refreshUserData} />
				</TabsContent>
				<TabsContent value="premium">
					<PremiumSubscription />
				</TabsContent>
				<TabsContent value="premium-payment">
					<PremiumPayment userId={userData?.id || ''} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
