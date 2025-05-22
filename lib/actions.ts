"use server"

import { neon } from "@neondatabase/serverless"
import { revalidatePath } from "next/cache"

// Initialize neon client
const sql = neon(process.env.DATABASE_URL!)

// Helper function for consistent error handling
async function executeQuery(queryFn: () => Promise<any>, errorMessage: string) {
  try {
    // Проверка соединения с базой данных - исправлена проверка результата
    const connectionTest = await sql`SELECT 1 as connection_test`
    if (!connectionTest || !connectionTest[0] || connectionTest[0].connection_test !== 1) {
      console.error("Database connection test failed:", connectionTest)
      return { error: "Database connection failed", status: 500 }
    }

    // Execute the actual query
    const result = await queryFn()
    return { data: result || [], status: 200 }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return {
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}

// Get recent games
export async function getRecentGames() {
  return executeQuery(async () => {
    // Check if the games table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'games'
      );
    `

    const tableExists = tableCheck?.[0]?.exists || false
    if (!tableExists) {
      console.log("Games table does not exist")
      return []
    }

    // Get recent games using tagged template syntax
    const games = await sql`
      SELECT g.*, 
             c.name as club_name,
             CASE WHEN u.name IS NOT NULL AND u.surname IS NOT NULL 
                  THEN u.name || ' ' || u.surname 
                  ELSE 'Unknown' 
             END as referee_name
      FROM games g
      LEFT JOIN users u ON g.referee_id = u.id
      LEFT JOIN clubs c ON g.club_id = c.id
      ORDER BY g.created_at DESC
      LIMIT 6
    `

    // Вместо запроса игроков для каждой игры, вернем игры без игроков
    // Это временное решение, чтобы исправить ошибку
    return games;

    /* Закомментируем проблемный код, который вызывает ошибку
    // Get players for each game
    const gamesWithPlayers = await Promise.all(
      games.map(async (game) => {
        const players = await sql`
          SELECT 
            u.id, 
            u.name, 
            u.surname,
            u.nickname,
            u.photo_url,
            gp.role
          FROM game_players gp
          JOIN users u ON gp.player_id = u.id
          WHERE gp.game_id = ${game.id}
          ORDER BY gp.slot_number ASC
        `
        return {
          ...game,
          players
        }
      })
    )

    return gamesWithPlayers
    */
  }, "Failed to fetch recent games")
}

// Get top clubs
export async function getTopClubs() {
  return executeQuery(async () => {
    // Check if tables exist first to avoid errors
    const tablesCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'clubs'
      );
    `

    const tableExists = tablesCheck?.[0]?.exists || false
    if (!tableExists) {
      console.log("Clubs table does not exist")
      return []
    }

    // Use tagged template syntax
    return await sql`
      SELECT c.*, 
             f.name as federation_name,
             (SELECT COUNT(*) FROM users u WHERE u.club_id = c.id) as player_count,
             (SELECT COUNT(DISTINCT g.id) 
              FROM games g 
              WHERE g.club_id = c.id) as game_count
      FROM clubs c
      LEFT JOIN federations f ON c.federation_id = f.id
      ORDER BY player_count DESC
      LIMIT 6
    `
  }, "Failed to fetch top clubs")
}

// Get dashboard stats
export async function getDashboardStats() {
  return executeQuery(async () => {
    // Check if tables exist
    const tablesCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('games', 'users', 'clubs', 'federations')
    `

    const existingTables = new Set(tablesCheck.map((row) => row.table_name))

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
      const gamesCount = await sql`SELECT COUNT(*) as count FROM games`
      stats.games = gamesCount?.[0]?.count || 0
    }

    if (existingTables.has("users")) {
      const playersCount = await sql`SELECT COUNT(*) as count FROM users`
      stats.players = playersCount?.[0]?.count || 0

      const judgesCount = await sql`SELECT COUNT(*) as count FROM users WHERE is_tournament_judge = true`
      stats.judges = judgesCount?.[0]?.count || 0
    }

    if (existingTables.has("clubs")) {
      const clubsCount = await sql`SELECT COUNT(*) as count FROM clubs`
      stats.clubs = clubsCount?.[0]?.count || 0
    }

    if (existingTables.has("federations")) {
      const federationsCount = await sql`SELECT COUNT(*) as count FROM federations`
      stats.federations = federationsCount?.[0]?.count || 0
    }

    return [stats]
  }, "Failed to fetch dashboard stats")
}

// Generic data fetching action
export async function fetchData(dataType: string, id?: string) {
  let queryFn: () => Promise<any>

  switch (dataType) {
    case "games":
      queryFn = async () => {
        return await sql`
          SELECT g.*, 
                 CASE WHEN u.name IS NOT NULL AND u.surname IS NOT NULL 
                      THEN u.name || ' ' || u.surname 
                      ELSE 'Unknown' 
                 END as referee_name
          FROM games g
          LEFT JOIN users u ON g.referee_id = u.id
          ORDER BY g.created_at DESC
        `
      }
      break
    case "players":
      queryFn = async () => {
        return await sql`
          SELECT u.*, c.name as club_name
          FROM users u
          LEFT JOIN clubs c ON u.club_id = c.id
          ORDER BY u.name ASC, u.surname ASC
        `
      }
      break
    case "users":
      queryFn = async () => {
        return await sql`
          SELECT 
            id, 
            name, 
            surname, 
            nickname,
            email,
            image,
            is_tournament_judge,
            role
          FROM users
          ORDER BY name ASC, surname ASC
        `
      }
      break
    case "clubs":
      queryFn = async () => {
        return await sql`
          SELECT c.*, 
                 f.name as federation_name,
                 (SELECT COUNT(*) FROM users u WHERE u.club_id = c.id) as player_count,
                 (SELECT COUNT(DISTINCT g.id) 
                  FROM games g 
                  JOIN game_players gp ON g.id = gp.game_id 
                  JOIN users u ON gp.player_id = u.id
                  WHERE u.club_id = c.id) as game_count
          FROM clubs c
          LEFT JOIN federations f ON c.federation_id = f.id
          ORDER BY c.name ASC
        `
      }
      break
    case "federations":
      queryFn = async () => {
        return await sql`
          SELECT f.*, 
                 (SELECT COUNT(*) FROM clubs c WHERE c.federation_id = f.id) as club_count,
                 (SELECT COUNT(*) FROM users u JOIN clubs c ON u.club_id = c.id WHERE c.federation_id = f.id) as player_count
          FROM federations f
          ORDER BY f.name ASC
        `
      }
      break
    case "game":
      if (!id) return { error: "Game ID is required", status: 400 }
      queryFn = async () => {
        return await sql`
          SELECT g.*, 
                 CASE WHEN u.name IS NOT NULL AND u.surname IS NOT NULL 
                      THEN u.name || ' ' || u.surname 
                      ELSE 'Unknown' 
                 END as referee_name
          FROM games g
          LEFT JOIN users u ON g.referee_id = u.id
          WHERE g.id = ${id}
        `
      }
      break
    default:
      return { error: `Unknown data type: ${dataType}`, status: 400 }
  }

  return executeQuery(async () => {
    // Check if the table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${dataType}
      );
    `

    const tableExists = tableCheck?.[0]?.exists || false
    if (!tableExists) {
      console.log(`${dataType} table does not exist`)
      return []
    }

    return await queryFn()
  }, `Failed to fetch ${dataType}`)
}

// Action to create or update data
export async function saveData(dataType: string, data: any, id?: string) {
  try {
    let result

    // Handle different data types
    switch (dataType) {
      case "game":
        // Implementation for saving game data
        break
      case "player":
        // Implementation for saving player data
        break
      case "club":
        // Implementation for saving club data
        break
      case "federation":
        // Implementation for saving federation data
        break
      default:
        return { error: `Unknown data type: ${dataType}`, status: 400 }
    }

    // Revalidate the path to update the UI
    revalidatePath(`/${dataType}s`)
    if (id) revalidatePath(`/${dataType}s/${id}`)

    return { success: true, data: result }
  } catch (error) {
    console.error(`Error saving ${dataType}:`, error)
    return {
      error: `Failed to save ${dataType}`,
      details: error instanceof Error ? error.message : "Unknown error",
      status: 500,
    }
  }
}
