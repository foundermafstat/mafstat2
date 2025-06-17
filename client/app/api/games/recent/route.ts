import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Check if the games table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'games'
      );
    `)

    const tableExists = tableCheck?.rows?.[0]?.exists || false

    if (!tableExists) {
      console.log("Games table does not exist")
      return NextResponse.json([])
    }

    // Get recent games without using parameters
    const games = await query(`
      SELECT g.*, 
             CASE WHEN p.name IS NOT NULL AND p.surname IS NOT NULL 
                  THEN p.name || ' ' || p.surname 
                  ELSE 'Unknown' 
             END as referee_name
      FROM games g
      LEFT JOIN players p ON g.referee_id = p.id
      ORDER BY g.created_at DESC
      LIMIT 6
    `)

    // Ensure we have an array of games
    const gamesArray = games?.rows || []

    // Return games without players for now to avoid parameter issues
    return NextResponse.json(gamesArray)
  } catch (error) {
    console.error("Error fetching recent games:", error)
    // Return an empty array instead of an error to avoid breaking the client
    return NextResponse.json([])
  }
}
