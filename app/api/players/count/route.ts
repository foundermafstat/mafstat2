import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM players`)
    return NextResponse.json(result.rows?.[0] || { count: 0 })
  } catch (error) {
    console.error("Error counting players:", error)
    return NextResponse.json({ count: 0 })
  }
}
