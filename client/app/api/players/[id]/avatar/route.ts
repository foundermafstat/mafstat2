import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// API-эндпоинт для получения аватара игрока
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Важно! В Next.js App Router необходимо получить и сохранить ID сразу
    const playerId = params.id;
    
    if (!playerId) {
      return new Response("Player ID is required", { status: 400 })
    }

    // Получаем URL фото игрока из базы данных
    const result = await query(
      `SELECT photo_url FROM players WHERE id = $1`,
      [playerId]
    )

    const player = Array.isArray(result) && result.length > 0 ? result[0] : null
    
    // Если у игрока есть URL фото, перенаправляем на него
    if (player && player.photo_url) {
      return NextResponse.redirect(player.photo_url)
    }
    
    // Если у игрока нет фото, перенаправляем на дефолтный аватар
    // Используем случайный аватар на основе ID игрока для визуального разнообразия
    const avatarSeed = parseInt(playerId, 10) % 10 // Используем остаток от деления для получения числа от 0 до 9
    return NextResponse.redirect(`https://api.dicebear.com/7.x/identicon/svg?seed=player-${playerId}-${avatarSeed}&backgroundColor=e5e7eb`)
  } catch (error) {
    console.error("Error fetching player avatar:", error)
    // В случае ошибки перенаправляем на дефолтный аватар
    return NextResponse.redirect(`https://api.dicebear.com/7.x/identicon/svg?seed=default&backgroundColor=e5e7eb`)
  }
}
