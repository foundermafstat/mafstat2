import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Check if tables exist first to avoid errors
    const tablesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clubs'
      );
    `)

    const tableExists = tablesCheck?.rows?.[0]?.exists || false

    if (!tableExists) {
      console.log("Clubs table does not exist")
      return NextResponse.json([])
    }

    // Use a simpler query that doesn't rely on complex joins or parameters
    const clubs = await query(`
      SELECT c.*, 
             f.name as federation_name,
             (SELECT COUNT(*) FROM players p WHERE p.club_id = c.id) as player_count,
             0 as game_count
      FROM clubs c
      LEFT JOIN federations f ON c.federation_id = f.id
      ORDER BY player_count DESC
      LIMIT 6
    `)

    return NextResponse.json(clubs.rows || [])
  } catch (error) {
    console.error("Error fetching top clubs:", error)
    // Return an empty array instead of an error to avoid breaking the client
    return NextResponse.json([])
  }
}
