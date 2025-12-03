import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json(
        { error: 'Требуется аутентификация' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Преобразуем данные для серверного API
    const gameData = {
      name: body.name,
      description: body.description,
      game_type: body.gameType || body.game_type || 'classic_10',
      result: body.result || '',
      referee_id: body.judge ? parseInt(body.judge) : session.user.id,
      referee_comments: body.refereeComments || '',
      table_number: body.table || body.table_number,
      club_id: body.club ? parseInt(body.club) : null,
      federation_id: body.federation ? parseInt(body.federation) : null,
      players: body.players || [],
      stages: body.stages || [],
      night_actions: body.nightActions || [],
    }

    const response = await fetch(`${API_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(gameData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при создании игры' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при создании игры' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, id: data.id || data.gameId, ...data })
  } catch (error) {
    console.error('Ошибка при создании игры:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

