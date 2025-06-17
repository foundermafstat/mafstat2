import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { initializeDatabase, seedInitialData } from "@/lib/db-init"

export async function GET() {
  try {
    // Test database connection
    const result = await query("SELECT 1 as connection_test")
    const isConnected = result?.rows?.[0]?.connection_test === 1

    // Get database tables status
    const tablesResult = await query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `)

    const tables = tablesResult?.rows || []

    // Get row counts for main tables
    const counts = {}
    const mainTables = ["federations", "clubs", "players", "games"]

    for (const table of mainTables) {
      if (tables.some((t) => t.table_name === table)) {
        const countResult = await query(`SELECT COUNT(*) as count FROM ${table}`)
        counts[table] = Number.parseInt(countResult?.rows?.[0]?.count || "0")
      } else {
        counts[table] = 0
      }
    }

    return NextResponse.json({
      status: isConnected ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
      database: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
      tables: tables.length,
      tablesList: tables,
      counts,
    })
  } catch (error) {
    console.error("Database status check error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    // Initialize database schema
    const initialized = await initializeDatabase()

    if (initialized) {
      // Seed initial data
      await seedInitialData()

      return NextResponse.json({
        status: "success",
        message: "Database initialized successfully",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to initialize database",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
