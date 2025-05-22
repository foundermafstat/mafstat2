import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET: Получение списка всех рейтингов
export async function GET() {
  try {
    // Запрос на получение всех рейтингов с данными о клубах и владельцах
    const ratings = await query(`
      SELECT r.*, 
             u.name as owner_name, 
             c.name as club_name,
             (SELECT COUNT(*) FROM rating_games WHERE rating_id = r.id) as game_count,
             (SELECT COUNT(*) FROM rating_results WHERE rating_id = r.id) as player_count
      FROM ratings r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN clubs c ON r.club_id = c.id
      ORDER BY r.created_at DESC
    `);

    return NextResponse.json({ success: true, ratings });
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

// POST: Создание нового рейтинга
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { name, description, club_id, start_date, end_date } = await request.json();
    
    // Валидация обязательных полей
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Rating name is required" },
        { status: 400 }
      );
    }
    
    // Получаем ID текущего пользователя
    const users = await query(`SELECT id FROM users WHERE email = $1`, [session.user.email]);
    const owner_id = users?.[0]?.id;
    
    if (!owner_id) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 400 }
      );
    }
    
    // Создаем новый рейтинг
    const result = await query(
      `INSERT INTO ratings (name, description, owner_id, club_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, owner_id, club_id, start_date || null, end_date || null]
    );
    
    const newRating = result[0];
    
    return NextResponse.json(
      { success: true, rating: newRating },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating rating:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create rating" },
      { status: 500 }
    );
  }
}
