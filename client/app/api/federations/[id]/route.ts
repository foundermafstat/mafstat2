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

    const response = await fetch(`${API_URL}/federations/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при получении федерации' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при получении федерации' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Преобразуем формат данных для совместимости с фронтендом
    const formattedData = {
      ...data,
      created_at: data.createdAt ? (typeof data.createdAt === 'string' ? data.createdAt : data.createdAt.toISOString()) : data.created_at,
      updated_at: data.updatedAt ? (typeof data.updatedAt === 'string' ? data.updatedAt : data.updatedAt.toISOString()) : data.updated_at,
      additional_points_conditions: data.additionalPointsConditions || data.additional_points_conditions,
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Ошибка при получении федерации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const token = session?.user?.accessToken

    if (!token) {
      return NextResponse.json(
        { error: 'Требуется аутентификация' },
        { status: 401 }
      )
    }

    const response = await fetch(`${API_URL}/federations/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении федерации' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при удалении федерации' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Ошибка при удалении федерации:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

