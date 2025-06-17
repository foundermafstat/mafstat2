import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/auth"
import { addBioFieldToUsers } from "@/lib/migrations/add-bio-field-to-users"

export async function POST() {
  try {
    // Проверяем аутентификацию и права доступа
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 })
    }
    
    // Проверяем, имеет ли пользователь права администратора
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Недостаточно прав для выполнения этой операции" }, { status: 403 })
    }
    
    // Запускаем миграцию
    const result = await addBioFieldToUsers()
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Ошибка при выполнении миграции", 
        details: result.error 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error("Ошибка при обработке запроса миграции:", error)
    return NextResponse.json({ 
      error: "Ошибка сервера при обработке запроса миграции",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
