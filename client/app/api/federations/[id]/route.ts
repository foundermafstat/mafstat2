import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Получаем и ожидаем параметры
    const resolvedParams = await Promise.resolve(params)
    
    if (!resolvedParams.id) {
      console.error("Federation ID is missing in params")
      return NextResponse.json({ error: "Federation ID is required" }, { status: 400 })
    }

    const federationId = resolvedParams.id
    console.log("Fetching federation with ID:", federationId)

    // Используем прямой запрос к базе данных через neon
    const sql = neon(process.env.DATABASE_URL || "")
    
    try {
      // Получаем федерацию напрямую
      const federationResult = await sql`
        SELECT f.*
        FROM federations f
        WHERE f.id = ${federationId}
      `
      console.log("Federation direct query result:", federationResult)

      if (!federationResult || federationResult.length === 0) {
        console.error("Federation not found in direct query")
        return NextResponse.json({ error: "Federation not found" }, { status: 404 })
      }

      const federation = federationResult[0]

      // Получаем клубы федерации
      const clubsResult = await sql`
        SELECT c.*, 
               (SELECT COUNT(*) FROM players p WHERE p.club_id = c.id) as player_count
        FROM clubs c
        WHERE c.federation_id = ${federationId}
        ORDER BY c.name ASC
      `
      console.log("Clubs direct query count:", clubsResult?.length || 0)

      // Parse additional_points_conditions if it's a string
      let additionalPointsConditions = federation.additional_points_conditions
      if (typeof additionalPointsConditions === "string") {
        try {
          additionalPointsConditions = JSON.parse(additionalPointsConditions)
          console.log("Parsed additional points conditions successfully")
        } catch (e) {
          console.error("Error parsing additional_points_conditions:", e)
        }
      }

      console.log("Returning federation data with clubs count:", clubsResult?.length || 0)
      const response = {
        ...federation,
        additional_points_conditions: additionalPointsConditions,
        clubs: clubsResult || [],
      }
      
      return NextResponse.json(response)
    } catch (sqlError) {
      console.error("SQL error:", sqlError)
      return NextResponse.json({ 
        error: "Database error", 
        details: String(sqlError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error fetching federation details:", error)
    return NextResponse.json({ 
      error: "Failed to fetch federation details", 
      details: String(error) 
    }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    // Получаем и ожидаем параметры
    const resolvedParams = await Promise.resolve(params)
    
    if (!resolvedParams.id) {
      return NextResponse.json({ error: "Federation ID is required" }, { status: 400 })
    }

    const federationId = resolvedParams.id
    const body = await request.json()
    const { name, description, url, country, city, additional_points_conditions } = body

    if (!name) {
      return NextResponse.json({ error: "Federation name is required" }, { status: 400 })
    }

    await query(
      `
      UPDATE federations
      SET name = $1, 
          description = $2, 
          url = $3, 
          country = $4, 
          city = $5, 
          additional_points_conditions = $6,
          updated_at = NOW()
      WHERE id = $7
    `,
      [
        name,
        description || null,
        url || null,
        country || null,
        city || null,
        additional_points_conditions ? JSON.stringify(additional_points_conditions) : null,
        federationId,
      ],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating federation:", error)
    return NextResponse.json({ error: "Failed to update federation" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Получаем и ожидаем параметры
    const resolvedParams = await Promise.resolve(params)
    
    if (!resolvedParams.id) {
      return NextResponse.json({ error: "Federation ID is required" }, { status: 400 })
    }

    const federationId = resolvedParams.id

    // Update clubs to remove federation association
    await query(
      `
      UPDATE clubs
      SET federation_id = NULL, updated_at = NOW()
      WHERE federation_id = $1
    `,
      [federationId],
    )

    // Delete the federation
    await query(
      `
      DELETE FROM federations
      WHERE id = $1
    `,
      [federationId],
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting federation:", error)
    return NextResponse.json({ error: "Failed to delete federation" }, { status: 500 })
  }
}
