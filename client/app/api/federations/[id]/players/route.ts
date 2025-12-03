import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const token = session?.user?.accessToken

    const response = await fetch(`${API_URL}/federations/${params.id}/players`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при получении игроков федерации' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при получении игроков федерации' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Преобразуем формат данных для совместимости с фронтендом
    const formattedData = Array.isArray(data) ? data.map((player: any) => ({
      ...player,
      created_at: player.created_at || player.createdAt,
      updated_at: player.updated_at || player.updatedAt,
      photo_url: player.photo_url || player.photoUrl || player.image,
      is_tournament_judge: player.is_tournament_judge !== undefined ? player.is_tournament_judge : player.isTournamentJudge,
      is_side_judge: player.is_side_judge !== undefined ? player.is_side_judge : player.isSideJudge,
    })) : []

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Ошибка при получении игроков федерации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

