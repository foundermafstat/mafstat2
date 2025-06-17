import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, url, country, city, additional_points_conditions } = body

    if (!name) {
      return NextResponse.json({ error: "Federation name is required" }, { status: 400 })
    }

    const result = await query(
      `
      INSERT INTO federations (
        name, 
        description, 
        url, 
        country, 
        city, 
        additional_points_conditions, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `,
      [
        name,
        description || null,
        url || null,
        country || null,
        city || null,
        additional_points_conditions ? JSON.stringify(additional_points_conditions) : null,
      ],
    )

    const id = result?.rows?.[0]?.id

    return NextResponse.json({ id, success: true })
  } catch (error) {
    console.error("Error creating federation:", error)
    return NextResponse.json({ error: "Failed to create federation" }, { status: 500 })
  }
}
