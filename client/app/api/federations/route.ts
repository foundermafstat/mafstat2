import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const token = session?.user?.accessToken

    const response = await fetch(`${API_URL}/federations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при получении федераций' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при получении федераций' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Преобразуем формат данных для совместимости с фронтендом
    const formattedData = Array.isArray(data) ? data.map((federation: any) => ({
      ...federation,
      created_at: federation.createdAt ? (typeof federation.createdAt === 'string' ? federation.createdAt : federation.createdAt.toISOString()) : federation.created_at,
      updated_at: federation.updatedAt ? (typeof federation.updatedAt === 'string' ? federation.updatedAt : federation.updatedAt.toISOString()) : federation.updated_at,
      additional_points_conditions: federation.additionalPointsConditions || federation.additional_points_conditions,
    })) : []

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Ошибка при получении федераций:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

