import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { hash } from "bcryptjs"

// API маршрут для создания тестовых аккаунтов
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Проверка существующих тестовых аккаунтов
    const existingUsers = await sql`
      SELECT * FROM users 
      WHERE email IN ('user@test.com', 'admin@test.com')
    `
    
    const existingEmails = existingUsers.map(user => user.email)
    
    // Создание тестового аккаунта обычного пользователя
    if (!existingEmails.includes('user@test.com')) {
      const userPassword = await hash('password123', 10)
      await sql`
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ('Тестовый пользователь', 'user@test.com', ${userPassword}, 'user', NOW(), NOW())
      `
    }
    
    // Создание тестового аккаунта администратора
    if (!existingEmails.includes('admin@test.com')) {
      const adminPassword = await hash('admin123', 10)
      await sql`
        INSERT INTO users (name, email, password, role, created_at, updated_at)
        VALUES ('Администратор', 'admin@test.com', ${adminPassword}, 'admin', NOW(), NOW())
      `
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Тестовые аккаунты созданы",
      testAccounts: [
        { type: "Пользователь", email: "user@test.com", password: "password123" },
        { type: "Администратор", email: "admin@test.com", password: "admin123" }
      ]
    })
  } catch (error) {
    console.error("Ошибка при создании тестовых аккаунтов:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Не удалось создать тестовые аккаунты" 
    }, { status: 500 })
  }
}
