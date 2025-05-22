import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM games`)
    return NextResponse.json(result.rows?.[0] || { count: 0 })
  } catch (error) {
    console.error("Error counting games:", error)
    return NextResponse.json({ count: 0 })
  }
}
