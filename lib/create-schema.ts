import { neon } from "@neondatabase/serverless"

// Initialize neon client
const sql = neon(process.env.DATABASE_URL!)

export async function createSchema() {
  try {
    // Create users table if it doesn't exist
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

    // Create sessions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT NOT NULL UNIQUE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `

    // Create accounts table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        provider_account_id TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, provider_account_id)
      )
    `

    // Create verification tokens table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(identifier, token)
      )
    `

    console.log("Database schema created successfully")
    return { success: true }
  } catch (error) {
    console.error("Error creating database schema:", error)
    return { success: false, error }
  }
}
