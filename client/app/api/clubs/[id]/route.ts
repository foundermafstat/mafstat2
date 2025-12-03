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

    const response = await fetch(`${API_URL}/clubs/${params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при получении клуба' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при получении клуба' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Преобразуем формат данных для совместимости с фронтендом
    const formattedData = {
      ...data,
      created_at: data.created_at ? (typeof data.created_at === 'string' ? data.created_at : data.created_at.toISOString()) : data.createdAt,
      updated_at: data.updated_at ? (typeof data.updated_at === 'string' ? data.updated_at : data.updated_at.toISOString()) : data.updatedAt,
      federation_name: data.federation_names?.[0] || data.federation_name || null,
      federation_id: data.federation_ids?.[0] || data.federation_id || null,
    }

    return NextResponse.json(formattedData)
  } catch (error) {
    console.error('Ошибка при получении клуба:', error)
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

    const response = await fetch(`${API_URL}/clubs/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Ошибка при удалении клуба' }))
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при удалении клуба' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Ошибка при удалении клуба:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

