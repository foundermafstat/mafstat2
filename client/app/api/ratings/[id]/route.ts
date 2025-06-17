import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

// GET: Получение информации о конкретном рейтинге
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Важно: правильно обрабатываем params
    const ratingId = params.id;

    // Получаем данные о рейтинге
    const ratingResults = await query(
      `SELECT r.*, 
              u.name as owner_name, 
              c.name as club_name
       FROM ratings r
       LEFT JOIN users u ON r.owner_id = u.id
       LEFT JOIN clubs c ON r.club_id = c.id
       WHERE r.id = $1`,
      [ratingId]
    );

    if (!ratingResults || ratingResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rating not found" },
        { status: 404 }
      );
    }

    const rating = ratingResults[0];

    // Получаем игры, включенные в рейтинг
    const games = await query(
      `SELECT g.* 
       FROM games g
       JOIN rating_games rg ON g.id = rg.game_id
       WHERE rg.rating_id = $1
       ORDER BY g.created_at DESC`,
      [ratingId]
    );

    // Получаем результаты игроков в рейтинге
    const playerResults = await query(
      `SELECT rr.*, 
              p.name, p.surname, p.nickname, p.photo_url, p.club_id,
              c.name as club_name
       FROM rating_results rr
       JOIN players p ON rr.player_id = p.id
       LEFT JOIN clubs c ON p.club_id = c.id
       WHERE rr.rating_id = $1
       ORDER BY rr.points DESC`,
      [ratingId]
    );

    return NextResponse.json({
      success: true,
      rating,
      games,
      playerResults
    });
  } catch (error) {
    console.error(`Error fetching rating ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rating details" },
      { status: 500 }
    );
  }
}

// PATCH: Обновление рейтинга
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { name, description, club_id, start_date, end_date, is_active } = await request.json();
    
    // Проверяем, существует ли рейтинг и имеет ли пользователь права на его изменение
    const checkResults = await query(
      `SELECT r.*, u.email 
       FROM ratings r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1`,
      [ratingId]
    );
    
    if (!checkResults || checkResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rating not found" },
        { status: 404 }
      );
    }
    
    // Проверка прав доступа - только владелец может редактировать
    if (checkResults[0].email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to edit this rating" },
        { status: 403 }
      );
    }
    
    // Обновляем рейтинг
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push("name = $" + (updateValues.length + 1));
      updateValues.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push("description = $" + (updateValues.length + 1));
      updateValues.push(description);
    }
    
    if (club_id !== undefined) {
      updateFields.push("club_id = $" + (updateValues.length + 1));
      updateValues.push(club_id);
    }
    
    if (start_date !== undefined) {
      updateFields.push("start_date = $" + (updateValues.length + 1));
      updateValues.push(start_date);
    }
    
    if (end_date !== undefined) {
      updateFields.push("end_date = $" + (updateValues.length + 1));
      updateValues.push(end_date);
    }
    
    if (is_active !== undefined) {
      updateFields.push("is_active = $" + (updateValues.length + 1));
      updateValues.push(is_active);
    }
    
    // Обновление timestamp
    updateFields.push("updated_at = NOW()");
    
    // Добавляем ID рейтинга в конец значений для WHERE
    updateValues.push(ratingId);
    
    const result = await query(
      `UPDATE ratings 
       SET ${updateFields.join(", ")}
       WHERE id = $${updateValues.length}
       RETURNING *`,
      updateValues
    );
    
    return NextResponse.json({ success: true, rating: result[0] });
  } catch (error) {
    console.error(`Error updating rating ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to update rating" },
      { status: 500 }
    );
  }
}

// DELETE: Удаление рейтинга
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ratingId = params.id;
    const session = await getServerSession(authOptions);
    
    // Проверка авторизации
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Проверяем, существует ли рейтинг и имеет ли пользователь права на его удаление
    const checkResults = await query(
      `SELECT r.*, u.email 
       FROM ratings r
       JOIN users u ON r.owner_id = u.id
       WHERE r.id = $1`,
      [ratingId]
    );
    
    if (!checkResults || checkResults.length === 0) {
      return NextResponse.json(
        { success: false, error: "Rating not found" },
        { status: 404 }
      );
    }
    
    // Проверка прав доступа - только владелец может удалять
    if (checkResults[0].email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this rating" },
        { status: 403 }
      );
    }
    
    // Удаляем рейтинг (каскадное удаление связанных записей происходит автоматически)
    await query(
      `DELETE FROM ratings WHERE id = $1`,
      [ratingId]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting rating ${params.id}:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to delete rating" },
      { status: 500 }
    );
  }
}
