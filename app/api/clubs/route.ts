import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT c.*, 
             f.name as federation_name,
             (SELECT COUNT(*) FROM players p WHERE p.club_id = c.id) as player_count,
             (SELECT COUNT(DISTINCT g.id) 
              FROM games g 
              JOIN game_players gp ON g.id = gp.game_id 
              JOIN players p ON gp.player_id = p.id 
              WHERE p.club_id = c.id) as game_count
      FROM clubs c
      LEFT JOIN federations f ON c.federation_id = f.id
      ORDER BY c.name ASC
    `)

    // Ensure we're returning an array
    const clubs = Array.isArray(result) ? result : result.rows || []

    return NextResponse.json({ clubs })
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return NextResponse.json({ error: "Failed to fetch clubs" }, { status: 500 })
  }
}
