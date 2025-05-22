import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, url, country, city, federation_id } = body

    if (!name) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO clubs (name, description, url, country, city, federation_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `,
      [name, description || null, url || null, country || null, city || null, federation_id || null],
    )

    const id = result?.rows?.[0]?.id

    return NextResponse.json({ id, success: true })
  } catch (error) {
    console.error("Error creating club:", error)
    return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
  }
}
