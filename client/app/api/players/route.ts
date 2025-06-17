import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT p.*, c.name as club_name
      FROM players p
      LEFT JOIN clubs c ON p.club_id = c.id
      ORDER BY p.name ASC, p.surname ASC
    `)

    // Ensure we're returning an array
    const players = Array.isArray(result) ? result : result.rows || []
    console.log("API players response:", players)

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
