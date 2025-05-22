import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const federation = searchParams.get("federation") || ""
    const club = searchParams.get("club") || ""
    const player = searchParams.get("player") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""

    console.log("Search params:", { search, federation, club, player, from, to })

    // Build the query
    let sql = `
      SELECT DISTINCT g.*, 
             CASE WHEN p.name IS NOT NULL AND p.surname IS NOT NULL 
                  THEN p.name || ' ' || p.surname 
                  ELSE 'Unknown' 
             END as referee_name
      FROM games g
      LEFT JOIN players p ON g.referee_id = p.id
    `

    const params: any[] = []
    const conditions: string[] = []

    // Add joins if needed
    if (player && player !== "all") {
      sql += `
        LEFT JOIN game_players gp ON g.id = gp.game_id
      `
      conditions.push(`gp.player_id = ${player}`)
    }

    if (club && club !== "all") {
      sql += `
        LEFT JOIN game_players gp2 ON g.id = gp2.game_id
        LEFT JOIN players p2 ON gp2.player_id = p2.id
      `
      conditions.push(`p2.club_id = ${club}`)
    }

    if (federation && federation !== "all") {
      sql += `
        LEFT JOIN players p3 ON g.referee_id = p3.id
        LEFT JOIN clubs c ON p3.club_id = c.id
      `
      conditions.push(`c.federation_id = ${federation}`)
    }

    // Add conditions
    if (search) {
      conditions.push(`(g.name ILIKE '%${search}%' OR g.description ILIKE '%${search}%')`)
    }

    if (from) {
      conditions.push(`g.created_at >= '${from}'`)
    }

    if (to) {
      conditions.push(`g.created_at <= '${to} 23:59:59'`)
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`
    }

    sql += ` ORDER BY g.created_at DESC`

    console.log("Executing SQL:", sql)
    const games = await query(sql)

    // Get players for each game
    const gamesWithPlayers = []

    for (const game of games.rows || []) {
      const players = await query(
        `
        SELECT gp.*, 
               p.name, p.surname, p.nickname, p.photo_url,
               c.name as club_name
        FROM game_players gp
        JOIN players p ON gp.player_id = p.id
        LEFT JOIN clubs c ON p.club_id = c.id
        WHERE gp.game_id = $1
        ORDER BY gp.slot_number ASC
      `,
        [game.id],
      )

      gamesWithPlayers.push({
        ...game,
        players: players.rows || [],
      })
    }

    return NextResponse.json(gamesWithPlayers)
  } catch (error) {
    console.error("Error searching games:", error)
    return NextResponse.json({ error: "Failed to search games" }, { status: 500 })
  }
}
