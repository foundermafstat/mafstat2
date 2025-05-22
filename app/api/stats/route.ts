import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist
    const tablesCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('games', 'players', 'clubs', 'federations')
    `)

    const existingTables = new Set(
      (Array.isArray(tablesCheck) ? tablesCheck : tablesCheck.rows || []).map((row) => row.table_name),
    )

    // Initialize stats
    const stats = {
      games: 0,
      players: 0,
      clubs: 0,
      federations: 0,
      judges: 0,
    }

    // Get counts for each table that exists
    if (existingTables.has("games")) {
      const gamesCount = await query(`SELECT COUNT(*) as count FROM games`)
      stats.games = gamesCount?.rows?.[0]?.count || 0
    }

    if (existingTables.has("players")) {
      const playersCount = await query(`SELECT COUNT(*) as count FROM players`)
      stats.players = playersCount?.rows?.[0]?.count || 0

      const judgesCount = await query(`SELECT COUNT(*) as count FROM players WHERE is_tournament_judge = true`)
      stats.judges = judgesCount?.rows?.[0]?.count || 0
    }

    if (existingTables.has("clubs")) {
      const clubsCount = await query(`SELECT COUNT(*) as count FROM clubs`)
      stats.clubs = clubsCount?.rows?.[0]?.count || 0
    }

    if (existingTables.has("federations")) {
      const federationsCount = await query(`SELECT COUNT(*) as count FROM federations`)
      stats.federations = federationsCount?.rows?.[0]?.count || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({
      games: 0,
      players: 0,
      clubs: 0,
      federations: 0,
      judges: 0,
    })
  }
}
