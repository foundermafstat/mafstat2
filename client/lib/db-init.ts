import { getNeon } from "./db"

// Function to initialize database schema
export async function initializeDatabase() {
  try {
    console.log("Checking database schema...")
    const sql = getNeon()

    // Check if tables exist
    const tablesExist = await checkTablesExist()

    if (!tablesExist) {
      console.log("Creating database schema...")
      await createDatabaseSchema()
    } else {
      console.log("Database schema already exists")
    }

    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

// Check if required tables exist
async function checkTablesExist() {
  try {
    const sql = getNeon()
    const result = await sql`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('games', 'players', 'clubs', 'federations')
    `

    const tableCount = Number.parseInt(result[0]?.table_count || "0")
    return tableCount === 4
  } catch (error) {
    console.error("Error checking tables:", error)
    return false
  }
}

// Create database schema if it doesn't exist
async function createDatabaseSchema() {
  try {
    const sql = getNeon()

    // Create federations table
    await sql`
      CREATE TABLE IF NOT EXISTS federations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(255),
        country VARCHAR(100),
        city VARCHAR(100),
        additional_points_conditions JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create clubs table
    await sql`
      CREATE TABLE IF NOT EXISTS clubs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(255),
        country VARCHAR(100),
        city VARCHAR(100),
        federation_id INTEGER REFERENCES federations(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        surname VARCHAR(100) NOT NULL,
        nickname VARCHAR(100),
        country VARCHAR(100),
        club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
        birthday DATE,
        gender VARCHAR(20),
        photo_url VARCHAR(255),
        is_tournament_judge BOOLEAN DEFAULT FALSE,
        is_side_judge BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        description TEXT,
        game_type VARCHAR(50) NOT NULL,
        result VARCHAR(50),
        referee_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
        referee_comments TEXT,
        table_number INTEGER,
        club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
        federation_id INTEGER REFERENCES federations(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create game_players table
    await sql`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        fouls INTEGER DEFAULT 0,
        additional_points NUMERIC(5,2) DEFAULT 0,
        slot_number INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, slot_number)
      )
    `

    // Create game_stages table
    await sql`
      CREATE TABLE IF NOT EXISTS game_stages (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        order_number INTEGER NOT NULL,
        data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create social_networks table
    await sql`
      CREATE TABLE IF NOT EXISTS social_networks (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        url VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create game_side_referees table
    await sql`
      CREATE TABLE IF NOT EXISTS game_side_referees (
        id SERIAL PRIMARY KEY,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, player_id)
      )
    `

    // Create users table for authentication
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user' NOT NULL,
        "emailVerified" TIMESTAMP WITH TIME ZONE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create sessions table for NextAuth
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `

    console.log("Database schema created successfully")
    return true
  } catch (error) {
    console.error("Error creating database schema:", error)
    throw error
  }
}

// Seed initial data if needed
export async function seedInitialData() {
  try {
    const sql = getNeon()

    // Check if federations table is empty
    const federationsResult = await sql`SELECT COUNT(*) as count FROM federations`
    const federationsCount = Number.parseInt(federationsResult[0]?.count || "0")

    if (federationsCount === 0) {
      console.log("Seeding initial federations data...")

      // Insert sample federations
      await sql`
        INSERT INTO federations (name, additional_points_conditions) VALUES
        ('FMAF', '[{"condition": "2+ mafia", "points": 0.1}, {"condition": "3 mafia", "points": 0.2}]'),
        ('MAF', '[{"condition": "2+ mafia", "points": 0.25}, {"condition": "3 mafia", "points": 0.5}]'),
        ('FIDE', '[{"condition": "2+ mafia", "points": 1}, {"condition": "3 mafia", "points": 2}]')
      `

      console.log("Initial federations data seeded successfully")
    }

    return true
  } catch (error) {
    console.error("Error seeding initial data:", error)
    return false
  }
}
