import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      WITH player_stats AS (
        SELECT 
          gp.player_id,
          COUNT(DISTINCT g.id) AS total_games,
          SUM(CASE WHEN gp.role = 'civilian' AND g.result = 'civilians_win' THEN 1 ELSE 0 END) AS civ_wins,
          SUM(CASE WHEN gp.role = 'civilian' THEN 1 ELSE 0 END) AS civ_games,
          SUM(CASE WHEN gp.role = 'mafia' AND g.result = 'mafia_win' THEN 1 ELSE 0 END) AS mafia_wins,
          SUM(CASE WHEN gp.role = 'mafia' THEN 1 ELSE 0 END) AS mafia_games,
          SUM(CASE WHEN gp.role = 'sheriff' AND g.result = 'civilians_win' THEN 1 ELSE 0 END) AS sheriff_wins,
          SUM(CASE WHEN gp.role = 'sheriff' THEN 1 ELSE 0 END) AS sheriff_games,
          SUM(CASE WHEN gp.role = 'don' AND g.result = 'mafia_win' THEN 1 ELSE 0 END) AS don_wins,
          SUM(CASE WHEN gp.role = 'don' THEN 1 ELSE 0 END) AS don_games,
          AVG(gp.additional_points) AS avg_additional_points,
          SUM(gp.fouls) AS total_fouls
        FROM 
          game_players gp
        JOIN 
          games g ON gp.game_id = g.id
        GROUP BY 
          gp.player_id
      )
      SELECT 
        u.id,
        u.name,
        u.surname,
        u.nickname,
        u.image,
        u.country,
        c.name AS club_name,
        c.id AS club_id,
        COALESCE(ps.total_games, 0) AS total_games,
        COALESCE(ps.civ_wins, 0) AS civ_wins,
        COALESCE(ps.civ_games, 0) AS civ_games,
        COALESCE(ps.mafia_wins, 0) AS mafia_wins,
        COALESCE(ps.mafia_games, 0) AS mafia_games,
        COALESCE(ps.sheriff_wins, 0) AS sheriff_wins,
        COALESCE(ps.sheriff_games, 0) AS sheriff_games,
        COALESCE(ps.don_wins, 0) AS don_wins,
        COALESCE(ps.don_games, 0) AS don_games,
        COALESCE(ps.avg_additional_points, 0) AS avg_additional_points,
        COALESCE(ps.total_fouls, 0) AS total_fouls
      FROM 
        users u
      LEFT JOIN 
        clubs c ON u.club_id = c.id
      LEFT JOIN 
        player_stats ps ON u.id = ps.player_id
      ORDER BY 
        ps.total_games DESC NULLS LAST,
        u.nickname ASC,
        u.name ASC
    `)

    // Ensure we're returning an array
    const playersStats = Array.isArray(result) ? result : result.rows || []
    
    // Calculate percentages and format data
    const formattedStats = playersStats.map((player: any) => ({
      id: player.id,
      name: player.name,
      surname: player.surname,
      nickname: player.nickname,
      image: player.image,
      country: player.country,
      club_name: player.club_name,
      club_id: player.club_id,
      total_games: player.total_games,
      civ_win_rate: player.civ_games > 0 ? ((player.civ_wins / player.civ_games) * 100).toFixed(2) : '0',
      mafia_win_rate: player.mafia_games > 0 ? ((player.mafia_wins / player.mafia_games) * 100).toFixed(2) : '0',
      sheriff_win_rate: player.sheriff_games > 0 ? ((player.sheriff_wins / player.sheriff_games) * 100).toFixed(2) : '0',
      don_win_rate: player.don_games > 0 ? ((player.don_wins / player.don_games) * 100).toFixed(2) : '0',
      avg_additional_points: Number.parseFloat(player.avg_additional_points).toFixed(2),
      total_fouls: player.total_fouls
    }))

    return NextResponse.json(formattedStats)
  } catch (error) {
    console.error("Error fetching player statistics:", error)
    return NextResponse.json({ error: "Failed to fetch player statistics" }, { status: 500 })
  }
}
