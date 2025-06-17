import { NextResponse } from "next/server"
import { createSchema } from "@/lib/create-schema"

export async function GET() {
  try {
    const result = await createSchema()

    if (result.success) {
      return NextResponse.json({ message: "Database schema created successfully" })
    } else {
      return NextResponse.json({ error: "Failed to create database schema", details: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "An error occurred during setup", details: error }, { status: 500 })
  }
}
