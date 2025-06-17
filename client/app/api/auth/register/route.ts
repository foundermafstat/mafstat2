import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { neon } from "@neondatabase/serverless"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Use direct SQL query with tagged template literals
    const sql = neon(process.env.DATABASE_URL!)

    // Check if user already exists
    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const newUser = await sql`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (${name}, ${email.toLowerCase()}, ${hashedPassword}, 'user', NOW(), NOW())
      RETURNING id
    `

    return NextResponse.json({ success: true, userId: newUser[0].id }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 })
  }
}
