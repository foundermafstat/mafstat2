import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const token = session?.user?.accessToken

    const response = await fetch(`${API_URL}/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при получении игры' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при получении игры' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Преобразуем формат данных для совместимости с фронтендом
    const formattedData = {
      ...data,
      created_at: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toISOString()) : data.created_at,
      updated_at: data.updatedAt ? (typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt.toISOString()) : data.updated_at,
      // Преобразуем gamePlayers в players для совместимости
      players: data.gamePlayers ? data.gamePlayers.map((gp: any) => ({
        id: gp.id,
        player_id: gp.playerId || gp.player?.id,
        role: gp.role,
        slot_number: gp.slotNumber,
        additional_points: gp.additionalPoints || gp.additional_points || 0,
        fouls: gp.fouls || 0,
        name: gp.player?.name,
        surname: gp.player?.surname,
        nickname: gp.player?.nickname,
        photo_url: gp.player?.image || gp.player?.photoUrl,
        club_name: gp.player?.club?.name,
      })) : data.players || [],
      // Преобразуем gameStages в stages
      stages: data.gameStages ? data.gameStages.map((gs: any) => ({
        id: gs.id,
        type: gs.type,
        order_number: gs.orderNumber,
        data: gs.data,
      })) : data.stages || [],
    }
    
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Ошибка при получении игры:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      game_type: body.gameType || body.game_type,
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

    const response = await fetch(`${API_URL}/games/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(gameData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при обновлении игры' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при обновлении игры' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, id: data.id || id, ...data })
  } catch (error) {
    console.error('Ошибка при обновлении игры:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

