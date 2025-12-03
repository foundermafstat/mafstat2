'use client';

import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/hooks/use-data';
import type { Game } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import {
	ArrowLeft,
	Calendar,
	Clock,
	Award,
	Users,
	Building2,
	Pencil,
	Trash2,
	Shield,
	Skull,
	Crown,
	UserCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useState, useEffect } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const getRoleIcon = (role, className = 'h-3.5 w-3.5 mr-0.5') => {
	switch (role) {
		case 'civilian':
			return <UserCircle className={className} />;
		case 'sheriff':
			return <Shield className={className} />;
		case 'mafia':
			return <Skull className={className} />;
		case 'don':
			return <Crown className={className} />;
		default:
			return null;
	}
};

const getPlayerResultText = (role, gameResult) => {
	if (!gameResult) return 'PENDING';
	if (gameResult === 'draw') return 'DRAW';

	// Нормализуем формат результата (может быть 'civilians', 'civilians_win', 'mafia', 'mafia_win')
	const normalizedResult = gameResult.includes('civilians')
		? 'civilians'
		: gameResult.includes('mafia')
			? 'mafia'
			: gameResult;

	// Команда красных (мирные + шериф) побеждает
	if (
		(role === 'civilian' || role === 'sheriff') &&
		normalizedResult === 'civilians'
	) {
		return 'WIN';
	}

	// Команда черных (дон + мафия) побеждает
	if ((role === 'don' || role === 'mafia') && normalizedResult === 'mafia') {
		return 'WIN';
	}

	return 'LOSS';
};

const getPlayerResultVariant = (role, gameResult) => {
	if (!gameResult) return 'outline';

	const result = getPlayerResultText(role, gameResult);
	if (result === 'WIN') return 'default';
	return 'destructive';
};

const getRoleBadgeVariant = (role, gameResult) => {
	if (!gameResult) return 'outline';

	// Нормализуем формат результата
	const normalizedResult = gameResult.includes('civilians')
		? 'civilians'
		: gameResult.includes('mafia')
			? 'mafia'
			: gameResult;

	switch (role) {
		case 'civilian':
			return normalizedResult === 'civilians' ? 'default' : 'outline';
		case 'sheriff':
			return normalizedResult === 'civilians' ? 'default' : 'outline';
		case 'mafia':
			return normalizedResult === 'mafia' ? 'destructive' : 'outline';
		case 'don':
			return normalizedResult === 'mafia' ? 'destructive' : 'outline';
		default:
			return 'outline';
	}
};

// Получить победное очко для игрока (1 для победившей команды, 0 для проигравшей)
const getWinPoint = (role, gameResult) => {
	if (!gameResult || gameResult === 'draw') return 0;

	// Нормализуем формат результата (может быть 'civilians', 'civilians_win', 'mafia', 'mafia_win')
	const normalizedResult = gameResult.includes('civilians')
		? 'civilians'
		: gameResult.includes('mafia')
			? 'mafia'
			: gameResult;

	// Команда красных (мирные + шериф)
	if (
		(role === 'civilian' || role === 'sheriff') &&
		normalizedResult === 'civilians'
	) {
		return 1;
	}

	// Команда черных (дон + мафия)
	if ((role === 'don' || role === 'mafia') && normalizedResult === 'mafia') {
		return 1;
	}

	return 0;
};

// Определить команду игрока
const getPlayerTeam = (role) => {
	if (role === 'civilian' || role === 'sheriff') {
		return 'red'; // Команда красных (мирные)
	}
	if (role === 'don' || role === 'mafia') {
		return 'black'; // Команда черных (мафия)
	}
	return null;
};

export default function GameDetailPage() {
	const params = useParams();
	const router = useRouter();
	const {
		data: responseData,
		isLoading,
		error,
	} = useData<{
		success?: boolean;
		error?: string;
		message?: string;
		players?: Array<{
			id: number;
			player_id: number;
			role: string;
			slot_number: number;
			additional_points: number;
			fouls: number;
			name?: string;
			surname?: string;
			nickname?: string;
			photo_url?: string;
			club_name?: string;
		}>;
		stages?: Array<{
			id: number;
			type: string;
			order_number: number;
			data: Record<string, unknown>;
		}>;
		[key: string]: unknown;
	}>(`/api/games/${params.id}`);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [game, setGame] = useState<Game | null>(null);

	useEffect(() => {
		if (responseData) {
			console.log('Game response data:', responseData);
			setGame(responseData);
		}
	}, [responseData]);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);

			const response = await fetch(`/api/games/${params.id}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete game');
			}

			toast({
				title: 'Game deleted',
				description: 'The game has been deleted successfully.',
			});

			router.push('/games');
		} catch (error) {
			console.error('Error deleting game:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete the game. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<main className="container py-6">
					<div className="animate-pulse space-y-4">
						<div className="h-8 w-64 bg-muted rounded"></div>
						<div className="h-64 bg-muted rounded-lg"></div>
					</div>
				</main>
			</div>
		);
	}

	if (error || !game) {
		return (
			<div className="min-h-screen bg-background">
				<main className="container py-6">
					<div className="text-center py-10">
						<h2 className="text-xl font-semibold mb-2">Ошибка загрузки игры</h2>
						<p className="text-red-500 mb-6">
							{error?.message ||
								(responseData?.error ? responseData.error : 'Игра не найдена')}
						</p>
						<Link href="/games">
							<Button>Вернуться к списку игр</Button>
						</Link>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<main className="container py-6 space-y-6">
				<div className="flex justify-between items-center">
					<div className="flex items-center">
						<Link href="/games">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Games
							</Button>
						</Link>
						<h1 className="text-3xl font-bold ml-4">
							{game.name || `Game #${game.id}`}
						</h1>
					</div>
					<div className="flex space-x-2">
						<Link href={`/games/${game.id}/edit`}>
							<Button variant="outline">
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</Button>
						</Link>
						<Button
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</Button>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-3">
					<Card className="md:col-span-2">
						<CardHeader>
							<CardTitle>Players</CardTitle>
						</CardHeader>
						<CardContent>
							{game.players && game.players.length > 0 ? (
								<Tabs defaultValue="cards">
									<TabsList className="mb-4">
										<TabsTrigger value="cards">Cards</TabsTrigger>
										<TabsTrigger value="table">Table</TabsTrigger>
									</TabsList>

									<TabsContent value="cards">
										<div className="space-y-4">
											{/* Сортируем игроков по слотам и разделяем по командам */}
											{(() => {
												// Фильтруем игроков по командам, если есть результат
												const sortedPlayers = [...game.players].sort(
													(a, b) => a.slot_number - b.slot_number
												);
												const winners =
													game.result === 'civilians_win'
														? sortedPlayers.filter(
																(p) =>
																	p.role === 'civilian' || p.role === 'sheriff'
															)
														: game.result === 'mafia_win'
															? sortedPlayers.filter(
																	(p) => p.role === 'mafia' || p.role === 'don'
																)
															: [];

												const losers =
													game.result === 'civilians_win'
														? sortedPlayers.filter(
																(p) => p.role === 'mafia' || p.role === 'don'
															)
														: game.result === 'mafia_win'
															? sortedPlayers.filter(
																	(p) =>
																		p.role === 'civilian' ||
																		p.role === 'sheriff'
																)
															: [];

												// Если есть результат, показываем в порядке победители-проигравшие
												if (game.result && winners.length > 0) {
													return (
														<>
															{/* Заголовок команды победителей */}
															<div className="flex items-center py-2 px-3 bg-green-50 rounded-md">
																<Award className="h-5 w-5 text-green-700 mr-2" />
																<h3 className="font-semibold text-green-700">
																	{game.result === 'civilians_win'
																		? 'Команда мирных'
																		: 'Команда мафии'}{' '}
																	(Победители)
																</h3>
															</div>

															{/* Игроки-победители */}
															{winners.map((player) => (
																<div
																	key={player.id}
																	className="flex items-center p-3 border border-green-200 rounded-lg bg-green-50/30"
																>
																	{/* Слот игрока */}
																	<div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-100 text-green-800 font-bold mr-3">
																		{player.slot_number}
																	</div>

																	{/* Карточка игрока */}
																	<div className="flex flex-1 items-center">
																		<Avatar className="h-10 w-10 border-2 border-green-200">
																			<AvatarImage
																				src={
																					player.photo_url ||
																					`/api/players/${player.player_id}/avatar`
																				}
																			/>
																			<AvatarFallback className="bg-green-100 text-green-800">
																				{player.name?.[0]}
																				{player.surname?.[0]}
																			</AvatarFallback>
																		</Avatar>

																		<div className="ml-3 flex-1">
																			<div className="font-medium">
																				<Link
																					href={`/players/${player.player_id}`}
																					className="hover:text-primary hover:underline"
																				>
																					{player.name} {player.surname}
																				</Link>
																				{player.nickname && (
																					<span className="ml-1 text-muted-foreground">
																						@{player.nickname}
																					</span>
																				)}
																			</div>
																			<div className="text-sm text-muted-foreground flex items-center">
																				{player.club_name && (
																					<span className="mr-2">
																						{player.club_name}
																					</span>
																				)}
																			</div>
																		</div>

																		<div className="flex items-center space-x-3">
																			{/* Фолы */}
																			<div className="flex flex-col items-center bg-white rounded-md px-2 py-1 min-w-[60px]">
																				<span className="text-xs text-muted-foreground">
																					Фолы
																				</span>
																				<span
																					className={`font-semibold ${
																						player.fouls >= 3
																							? 'text-red-500'
																							: player.fouls > 0
																								? 'text-yellow-500'
																								: 'text-muted-foreground'
																					}`}
																				>
																					{player.fouls}
																				</span>
																			</div>

																			{/* Доп. очки */}
																			<div className="flex flex-col items-center bg-white rounded-md px-2 py-1 min-w-[60px]">
																				<span className="text-xs text-muted-foreground">
																					Доп. очки
																				</span>
																				<span className="font-semibold text-green-600">
																					+{player.additional_points}
																				</span>
																			</div>

																			{/* Роль */}
																			<Badge
																				className="ml-2"
																				variant={getRoleBadgeVariant(
																					player.role,
																					game.result
																				)}
																			>
																				{getRoleIcon(player.role)}
																				<span className="ml-1">
																					{player.role
																						? player.role
																								.charAt(0)
																								.toUpperCase() +
																							player.role.slice(1)
																						: 'Unknown'}
																				</span>
																			</Badge>
																		</div>
																	</div>
																</div>
															))}

															{/* Заголовок команды проигравших */}
															{losers.length > 0 && (
																<div className="flex items-center py-2 px-3 bg-red-50 rounded-md mt-6">
																	<Skull className="h-5 w-5 text-red-700 mr-2" />
																	<h3 className="font-semibold text-red-700">
																		{game.result === 'civilians_win'
																			? 'Команда мафии'
																			: 'Команда мирных'}{' '}
																		(Проигравшие)
																	</h3>
																</div>
															)}

															{/* Игроки-проигравшие */}
															{losers.map((player) => (
																<div
																	key={player.id}
																	className="flex items-center p-3 border border-red-200 rounded-lg bg-red-50/30"
																>
																	{/* Слот игрока */}
																	<div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 text-red-800 font-bold mr-3">
																		{player.slot_number}
																	</div>

																	{/* Карточка игрока */}
																	<div className="flex flex-1 items-center">
																		<Avatar className="h-10 w-10 border-2 border-red-200">
																			<AvatarImage
																				src={
																					player.photo_url ||
																					`/api/players/${player.player_id}/avatar`
																				}
																			/>
																			<AvatarFallback className="bg-red-100 text-red-800">
																				{player.name?.[0]}
																				{player.surname?.[0]}
																			</AvatarFallback>
																		</Avatar>

																		<div className="ml-3 flex-1">
																			<div className="font-medium">
																				<Link
																					href={`/players/${player.player_id}`}
																					className="hover:text-primary hover:underline"
																				>
																					{player.name} {player.surname}
																				</Link>
																				{player.nickname && (
																					<span className="ml-1 text-muted-foreground">
																						@{player.nickname}
																					</span>
																				)}
																			</div>
																			<div className="text-sm text-muted-foreground flex items-center">
																				{player.club_name && (
																					<span className="mr-2">
																						{player.club_name}
																					</span>
																				)}
																			</div>
																		</div>

																		<div className="flex items-center space-x-3">
																			{/* Фолы */}
																			<div className="flex flex-col items-center bg-white rounded-md px-2 py-1 min-w-[60px]">
																				<span className="text-xs text-muted-foreground">
																					Фолы
																				</span>
																				<span
																					className={`font-semibold ${
																						player.fouls >= 3
																							? 'text-red-500'
																							: player.fouls > 0
																								? 'text-yellow-500'
																								: 'text-muted-foreground'
																					}`}
																				>
																					{player.fouls}
																				</span>
																			</div>

																			{/* Доп. очки */}
																			<div className="flex flex-col items-center bg-white rounded-md px-2 py-1 min-w-[60px]">
																				<span className="text-xs text-muted-foreground">
																					Доп. очки
																				</span>
																				<span className="font-semibold text-green-600">
																					+{player.additional_points}
																				</span>
																			</div>

																			{/* Роль */}
																			<Badge
																				className="ml-2"
																				variant={getRoleBadgeVariant(
																					player.role,
																					game.result
																				)}
																			>
																				{getRoleIcon(player.role)}
																				<span className="ml-1">
																					{player.role
																						? player.role
																								.charAt(0)
																								.toUpperCase() +
																							player.role.slice(1)
																						: 'Unknown'}
																				</span>
																			</Badge>
																		</div>
																	</div>
																</div>
															))}
														</>
													);
												} else {
													// Отображаем всех игроков в порядке слотов, если нет результата
													return sortedPlayers.map((player) => (
														<div
															key={player.id}
															className="flex items-center p-3 border rounded-lg hover:bg-muted/30 transition-colors"
														>
															{/* Слот игрока */}
															<div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-muted-foreground font-bold mr-3">
																{player.slot_number}
															</div>

															{/* Карточка игрока */}
															<div className="flex flex-1 items-center">
																<Avatar className="h-10 w-10 border-2 border-muted">
																	<AvatarImage
																		src={
																			player.photo_url ||
																			`/api/players/${player.player_id}/avatar`
																		}
																	/>
																	<AvatarFallback>
																		{player.name?.[0]}
																		{player.surname?.[0]}
																	</AvatarFallback>
																</Avatar>

																<div className="ml-3 flex-1">
																	<div className="font-medium">
																		<Link
																			href={`/players/${player.player_id}`}
																			className="hover:text-primary hover:underline"
																		>
																			{player.name} {player.surname}
																		</Link>
																		{player.nickname && (
																			<span className="ml-1 text-muted-foreground">
																				@{player.nickname}
																			</span>
																		)}
																	</div>
																	<div className="text-sm text-muted-foreground flex items-center">
																		{player.club_name && (
																			<span className="mr-2">
																				{player.club_name}
																			</span>
																		)}
																	</div>
																</div>

																<div className="flex items-center space-x-3">
																	{/* Фолы */}
																	<div className="flex flex-col items-center bg-muted/50 rounded-md px-2 py-1 min-w-[60px]">
																		<span className="text-xs text-muted-foreground">
																			Фолы
																		</span>
																		<span
																			className={`font-semibold ${
																				player.fouls >= 3
																					? 'text-red-500'
																					: player.fouls > 0
																						? 'text-yellow-500'
																						: 'text-muted-foreground'
																			}`}
																		>
																			{player.fouls}
																		</span>
																	</div>

																	{/* Доп. очки */}
																	<div className="flex flex-col items-center bg-muted/50 rounded-md px-2 py-1 min-w-[60px]">
																		<span className="text-xs text-muted-foreground">
																			Доп. очки
																		</span>
																		<span className="font-semibold text-green-600">
																			+{player.additional_points}
																		</span>
																	</div>

																	{/* Роль */}
																	<Badge className="ml-2" variant="outline">
																		{getRoleIcon(player.role)}
																		<span className="ml-1">
																			{player.role.charAt(0).toUpperCase() +
																				player.role.slice(1)}
																		</span>
																	</Badge>
																</div>
															</div>
														</div>
													));
												}
											})()}
										</div>
									</TabsContent>

									<TabsContent value="table">
										<Table>
											<TableCaption>
												Detailed player statistics for this game
											</TableCaption>
											<TableHeader>
												<TableRow>
													<TableHead className="w-12">Slot</TableHead>
													<TableHead>Player</TableHead>
													<TableHead>Role</TableHead>
													<TableHead className="w-28">Result</TableHead>
													<TableHead className="text-right">Points</TableHead>
													<TableHead className="text-right">Fouls</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{game.players
													.sort((a, b) => a.slot_number - b.slot_number)
													.map((player) => (
														<TableRow key={player.id}>
															<TableCell className="font-medium">
																{player.slot_number}
															</TableCell>
															<TableCell>
																<div className="flex items-center space-x-2">
																	<Avatar className="h-6 w-6">
																		<AvatarImage
																			src={player.photo_url || undefined}
																		/>
																		<AvatarFallback className="text-xs">
																			{player.name?.[0]}
																			{player.surname?.[0]}
																		</AvatarFallback>
																	</Avatar>
																	<Link
																		href={`/players/${player.player_id}`}
																		className="hover:text-primary hover:underline"
																	>
																		{player.name} {player.surname}
																	</Link>
																</div>
															</TableCell>
															<TableCell>
																<div className="flex items-center">
																	{getRoleIcon(player.role, 'h-4 w-4 mr-1')}
																	{player.role
																		? player.role.charAt(0).toUpperCase() +
																			player.role.slice(1)
																		: 'Unknown'}
																</div>
															</TableCell>
															<TableCell>
																<Badge
																	variant={getPlayerResultVariant(
																		player.role,
																		game.result
																	)}
																>
																	{getPlayerResultText(
																		player.role,
																		game.result
																	)}
																</Badge>
															</TableCell>
															<TableCell className="text-right">
																<div className="flex flex-col items-end gap-1">
																	<div className="font-semibold">
																		{getWinPoint(player.role, game.result)} +{' '}
																		{player.additional_points ||
																			player.additionalPoints ||
																			0}
																	</div>
																	<div className="text-xs text-muted-foreground">
																		({getWinPoint(player.role, game.result)}{' '}
																		победа +{' '}
																		{player.additional_points ||
																			player.additionalPoints ||
																			0}{' '}
																		доп.)
																	</div>
																</div>
															</TableCell>
															<TableCell className="text-right">
																<span
																	className={
																		player.fouls > 0
																			? player.fouls >= 3
																				? 'text-red-500'
																				: 'text-yellow-500'
																			: ''
																	}
																>
																	{player.fouls}
																</span>
															</TableCell>
														</TableRow>
													))}
											</TableBody>
										</Table>
									</TabsContent>
								</Tabs>
							) : (
								<div className="text-center py-4 text-muted-foreground">
									No players assigned to this game
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="">
						<CardHeader>
							<CardTitle>Game Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="flex items-start space-x-3">
									<Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<div className="font-medium">Date</div>
										<div>
											{game.created_at
												? (() => {
														const date = new Date(game.created_at);
														return isNaN(date.getTime())
															? 'Не указано'
															: format(date, 'PPP');
													})()
												: 'Не указано'}
										</div>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<div className="font-medium">Time</div>
										<div>
											{game.created_at
												? (() => {
														const date = new Date(game.created_at);
														return isNaN(date.getTime())
															? 'Не указано'
															: format(date, 'p');
													})()
												: 'Не указано'}
										</div>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<Award className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<div className="font-medium">Judge</div>
										<div>{game.referee_name || 'Not assigned'}</div>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<Users className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<div className="font-medium">Players</div>
										<div>{game.players?.length || 0}</div>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
									<div>
										<div className="font-medium">Game Type</div>
										<div>
											{game.game_type
												? game.game_type.charAt(0).toUpperCase() +
													game.game_type.slice(1)
												: 'Unknown'}
										</div>
									</div>
								</div>

								<div className="flex items-start space-x-3">
									<div className="h-5 w-5 flex items-center justify-center text-muted-foreground mt-0.5">
										🏆
									</div>
									<div>
										<div className="font-medium">Result</div>
										<div>
											{game.result
												? game.result
														.split('_')
														.map((word) =>
															word
																? word.charAt(0).toUpperCase() + word.slice(1)
																: ''
														)
														.filter(Boolean)
														.join(' ')
												: 'In progress'}
										</div>
									</div>
								</div>
							</div>

							{game.description && (
								<div className="mt-6">
									<h3 className="font-medium mb-2">Description</h3>
									<p className="text-muted-foreground">{game.description}</p>
								</div>
							)}

							{game.refereeComments && (
								<div className="mt-6">
									<h3 className="font-medium mb-2">Referee Comments</h3>
									<p className="text-muted-foreground">
										{game.refereeComments}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Результаты игры и стадии - через табы */}
					<Card className="md:col-span-3">
						<CardHeader>
							<CardTitle>Результаты игры и стадии</CardTitle>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="results" className="w-full">
								<TabsList className="mb-4">
									<TabsTrigger value="results">Результаты игры</TabsTrigger>
									{game.stages && game.stages.length > 0 && (
										<TabsTrigger value="stages">Стадии игры</TabsTrigger>
									)}
								</TabsList>

								<TabsContent value="results">
									{game.players && game.players.length > 0 ? (
										<div className="space-y-6">
											{/* Команда красных (мирные) */}
											<div>
												<div className="flex items-center mb-3 px-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
													<div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
													<span className="font-semibold text-red-700 dark:text-red-400">
														Команда красных (Мирные жители + Шериф) - 7 игроков
													</span>
												</div>
												<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
													{game.players
														.filter(
															(p) =>
																p.role === 'civilian' || p.role === 'sheriff'
														)
														.sort(
															(a, b) =>
																(a.slot_number || 0) - (b.slot_number || 0)
														)
														.map((player) => {
															const winPoint = getWinPoint(
																player.role,
																game.result
															);
															const additionalPoints =
																player.additional_points ||
																player.additionalPoints ||
																0;
															return (
																<div
																	key={player.id || player.player_id}
																	className="flex items-center space-x-3 p-3 border rounded-lg bg-red-50/50 dark:bg-red-950/10"
																>
																	<Avatar>
																		<AvatarImage
																			src={player.photo_url || player.image}
																			alt={`${player.name} ${player.surname || ''}`}
																		/>
																		<AvatarFallback>
																			{player.name?.charAt(0) || ''}
																			{player.surname?.charAt(0) || ''}
																		</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<div className="font-medium truncate">
																			{player.name} {player.surname || ''}
																		</div>
																		{player.nickname && (
																			<div className="text-sm text-muted-foreground truncate">
																				@{player.nickname}
																			</div>
																		)}
																		<div className="flex items-center gap-2 mt-1">
																			<Badge
																				variant={getRoleBadgeVariant(
																					player.role,
																					game.result
																				)}
																				className="text-xs"
																			>
																				{getRoleIcon(
																					player.role,
																					'h-3 w-3 mr-1'
																				)}
																				{player.role
																					? player.role
																							.charAt(0)
																							.toUpperCase() +
																						player.role.slice(1)
																					: 'Unknown'}
																			</Badge>
																		</div>
																		<div className="flex items-center gap-3 mt-2 text-sm">
																			<div className="flex items-center gap-1">
																				<span className="text-muted-foreground">
																					Победное очко:
																				</span>
																				<Badge
																					variant={
																						winPoint === 1
																							? 'default'
																							: 'outline'
																					}
																					className="text-xs"
																				>
																					{winPoint}
																				</Badge>
																			</div>
																			{additionalPoints > 0 && (
																				<div className="flex items-center gap-1">
																					<span className="text-muted-foreground">
																						Доп. баллы:
																					</span>
																					<Badge
																						variant="secondary"
																						className="text-xs"
																					>
																						+{additionalPoints}
																					</Badge>
																				</div>
																			)}
																		</div>
																		<div className="text-xs text-muted-foreground mt-1">
																			Слот: {player.slot_number || 'N/A'}
																			{player.fouls > 0 &&
																				` • Фолы: ${player.fouls}`}
																		</div>
																	</div>
																</div>
															);
														})}
												</div>
											</div>

											{/* Команда черных (мафия) */}
											<div>
												<div className="flex items-center mb-3 px-3 py-2 bg-gray-900 dark:bg-gray-800 rounded-md border border-gray-700">
													<div className="w-3 h-3 rounded-full bg-gray-700 dark:bg-gray-600 mr-2"></div>
													<span className="font-semibold text-gray-100 dark:text-gray-300">
														Команда черных (Дон + Мафия) - 3 игрока
													</span>
												</div>
												<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
													{game.players
														.filter(
															(p) => p.role === 'don' || p.role === 'mafia'
														)
														.sort((a, b) => {
															// Сначала дон, потом мафия
															if (a.role === 'don' && b.role !== 'don')
																return -1;
															if (a.role !== 'don' && b.role === 'don')
																return 1;
															return (
																(a.slot_number || 0) - (b.slot_number || 0)
															);
														})
														.map((player) => {
															const winPoint = getWinPoint(
																player.role,
																game.result
															);
															const additionalPoints =
																player.additional_points ||
																player.additionalPoints ||
																0;
															return (
																<div
																	key={player.id || player.player_id}
																	className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-900/50"
																>
																	<Avatar>
																		<AvatarImage
																			src={player.photo_url || player.image}
																			alt={`${player.name} ${player.surname || ''}`}
																		/>
																		<AvatarFallback>
																			{player.name?.charAt(0) || ''}
																			{player.surname?.charAt(0) || ''}
																		</AvatarFallback>
																	</Avatar>
																	<div className="flex-1 min-w-0">
																		<div className="font-medium truncate">
																			{player.name} {player.surname || ''}
																		</div>
																		{player.nickname && (
																			<div className="text-sm text-muted-foreground truncate">
																				@{player.nickname}
																			</div>
																		)}
																		<div className="flex items-center gap-2 mt-1">
																			<Badge
																				variant={getRoleBadgeVariant(
																					player.role,
																					game.result
																				)}
																				className="text-xs"
																			>
																				{getRoleIcon(
																					player.role,
																					'h-3 w-3 mr-1'
																				)}
																				{player.role
																					? player.role
																							.charAt(0)
																							.toUpperCase() +
																						player.role.slice(1)
																					: 'Unknown'}
																			</Badge>
																		</div>
																		<div className="flex items-center gap-3 mt-2 text-sm">
																			<div className="flex items-center gap-1">
																				<span className="text-muted-foreground">
																					Победное очко:
																				</span>
																				<Badge
																					variant={
																						winPoint === 1
																							? 'default'
																							: 'outline'
																					}
																					className="text-xs"
																				>
																					{winPoint}
																				</Badge>
																			</div>
																			{additionalPoints > 0 && (
																				<div className="flex items-center gap-1">
																					<span className="text-muted-foreground">
																						Доп. баллы:
																					</span>
																					<Badge
																						variant="secondary"
																						className="text-xs"
																					>
																						+{additionalPoints}
																					</Badge>
																				</div>
																			)}
																		</div>
																		<div className="text-xs text-muted-foreground mt-1">
																			Слот: {player.slot_number || 'N/A'}
																			{player.fouls > 0 &&
																				` • Фолы: ${player.fouls}`}
																		</div>
																	</div>
																</div>
															);
														})}
												</div>
											</div>
										</div>
									) : (
										<div className="text-center py-8 text-muted-foreground">
											Нет данных об игроках
										</div>
									)}
								</TabsContent>

								{game.stages && game.stages.length > 0 && (
									<TabsContent value="stages">
										<Tabs defaultValue="timeline" className="w-full">
											<TabsList className="mb-4">
												<TabsTrigger value="timeline">Timeline</TabsTrigger>
												<TabsTrigger value="night">Night Actions</TabsTrigger>
												<TabsTrigger value="day">Day Votes</TabsTrigger>
											</TabsList>

											<TabsContent value="timeline">
												<div className="space-y-4">
													{[...game.stages]
														.sort((a, b) => {
															// Если стадии из одного дня/ночи, сортируем день перед ночью
															if (
																Math.ceil(a.order_number / 2) ===
																Math.ceil(b.order_number / 2)
															) {
																return a.type === 'day' ? -1 : 1;
															}
															// Иначе сохраняем обычную сортировку по номеру
															return a.order_number - b.order_number;
														})
														.map((stage) => (
															<div key={stage.id} className="flex">
																<div className="mr-4 flex flex-col items-center">
																	<div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
																		{Math.ceil(stage.order_number / 2)}
																	</div>
																	<div className="h-full w-0.5 bg-border"></div>
																</div>
																<div className="flex-1 pb-8">
																	<div className="font-medium">
																		{stage.type
																			? stage.type.charAt(0).toUpperCase() +
																				stage.type.slice(1)
																			: 'Unknown'}{' '}
																		{Math.ceil(stage.order_number / 2)}
																	</div>
																	<div className="mt-2 p-3 bg-muted rounded-lg">
																		{stage.type === 'night' ? (
																			<div className="space-y-2">
																				<div className="flex justify-between">
																					<span>Mafia Shot:</span>
																					<span>
																						{stage.data.mafiaShot !== null
																							? `Player ${stage.data.mafiaShot}`
																							: 'Miss'}
																					</span>
																				</div>
																				<div className="flex justify-between">
																					<span>Don Check:</span>
																					<span>
																						{stage.data.donCheck !== null
																							? `Player ${stage.data.donCheck}`
																							: 'None'}
																					</span>
																				</div>
																				<div className="flex justify-between">
																					<span>Sheriff Check:</span>
																					<span>
																						{stage.data.sheriffCheck !== null
																							? `Player ${stage.data.sheriffCheck}`
																							: 'None'}
																					</span>
																				</div>
																			</div>
																		) : (
																			<div className="space-y-2">
																				<div>
																					<span className="font-medium">
																						Candidates:{' '}
																					</span>
																					<span>
																						{stage.data.candidates
																							.filter(Boolean)
																							.join(', ') || 'None'}
																					</span>
																				</div>
																				<div>
																					<span className="font-medium">
																						Votes:{' '}
																					</span>
																					<span>
																						{stage.data.votes
																							.filter(Boolean)
																							.join(', ') || 'None'}
																					</span>
																				</div>
																				{stage.data.revote &&
																					stage.data.revote.some(Boolean) && (
																						<div>
																							<span className="font-medium">
																								Revote:{' '}
																							</span>
																							<span>
																								{stage.data.revote
																									.filter(Boolean)
																									.join(', ') || 'None'}
																							</span>
																						</div>
																					)}
																				<div>
																					<span className="font-medium">
																						Results:{' '}
																					</span>
																					<span>
																						{stage.data.results
																							.filter(Boolean)
																							.join(', ') || 'None'}
																					</span>
																				</div>
																			</div>
																		)}
																	</div>
																</div>
															</div>
														))}
												</div>
											</TabsContent>

											<TabsContent value="night">
												<div className="space-y-4">
													{game.stages
														.filter((stage) => stage.type === 'night')
														.map((stage) => (
															<Card key={stage.id}>
																<CardHeader className="pb-2">
																	<CardTitle>
																		Night {Math.ceil(stage.order_number / 2)}
																	</CardTitle>
																</CardHeader>
																<CardContent>
																	<div className="space-y-2">
																		<div className="flex justify-between">
																			<span className="font-medium">
																				Mafia Shot:
																			</span>
																			<span>
																				{stage.data.mafiaShot !== null
																					? `Player ${stage.data.mafiaShot}`
																					: 'Miss'}
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span className="font-medium">
																				Don Check:
																			</span>
																			<span>
																				{stage.data.donCheck !== null
																					? `Player ${stage.data.donCheck}`
																					: 'None'}
																			</span>
																		</div>
																		<div className="flex justify-between">
																			<span className="font-medium">
																				Sheriff Check:
																			</span>
																			<span>
																				{stage.data.sheriffCheck !== null
																					? `Player ${stage.data.sheriffCheck}`
																					: 'None'}
																			</span>
																		</div>
																	</div>
																</CardContent>
															</Card>
														))}
												</div>
											</TabsContent>

											<TabsContent value="day">
												<div className="space-y-4">
													{game.stages
														.filter((stage) => stage.type === 'day')
														.map((stage) => (
															<Card key={stage.id}>
																<CardHeader className="pb-2">
																	<CardTitle>
																		Day {Math.ceil(stage.order_number / 2)}
																	</CardTitle>
																</CardHeader>
																<CardContent>
																	<div className="space-y-2">
																		<div>
																			<span className="font-medium">
																				Candidates:{' '}
																			</span>
																			<span>
																				{stage.data.candidates
																					.filter(Boolean)
																					.join(', ') || 'None'}
																			</span>
																		</div>
																		<div>
																			<span className="font-medium">
																				Votes:{' '}
																			</span>
																			<span>
																				{stage.data.votes
																					.filter(Boolean)
																					.join(', ') || 'None'}
																			</span>
																		</div>
																		{stage.data.revote &&
																			stage.data.revote.some(Boolean) && (
																				<div>
																					<span className="font-medium">
																						Revote:{' '}
																					</span>
																					<span>
																						{stage.data.revote
																							.filter(Boolean)
																							.join(', ') || 'None'}
																					</span>
																				</div>
																			)}
																		<div>
																			<span className="font-medium">
																				Results:{' '}
																			</span>
																			<span>
																				{stage.data.results
																					.filter(Boolean)
																					.join(', ') || 'None'}
																			</span>
																		</div>
																	</div>
																</CardContent>
															</Card>
														))}
												</div>
											</TabsContent>
										</Tabs>
									</TabsContent>
								)}
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</main>

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the
							game and all associated data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-red-600 hover:bg-red-700"
						>
							{isDeleting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
