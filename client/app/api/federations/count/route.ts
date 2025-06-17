import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`SELECT COUNT(*) as count FROM federations`)
    return NextResponse.json(result.rows?.[0] || { count: 0 })
  } catch (error) {
    console.error("Error counting federations:", error)
    return NextResponse.json({ count: 0 })
  }
}
