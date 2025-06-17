import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`Запуск эндпоинта GET /api/federations/[id]/players с ID: ${params.id}`);
  try {
    // Получаем и ожидаем параметры
    const resolvedParams = await Promise.resolve(params)
    
    if (!resolvedParams.id) {
      console.error("Federation ID is missing in params")
      return NextResponse.json({ error: "Federation ID is required" }, { status: 400 })
    }

    const federationId = resolvedParams.id
    console.log("Fetching players for federation with ID:", federationId)

    // Используем прямой запрос к базе данных через neon
    const sql = neon(process.env.DATABASE_URL || "")
    
    try {
      // Получаем всех игроков из клубов этой федерации с базовой статистикой
      // Упрощенный запрос для гарантированного получения игроков
      console.log(`Выполнение запроса для получения игроков федерации ID: ${federationId}`);
      
      // Сначала проверим, есть ли клубы в этой федерации
      const clubsResult = await sql`
        SELECT id, name FROM clubs WHERE federation_id = ${federationId}
      `;
      
      console.log(`Найдено клубов в федерации: ${clubsResult.length}`);
      
      if (clubsResult.length === 0) {
        console.log('Клубы не найдены для данной федерации');
        return NextResponse.json([]);
      }
      
      // Получаем список ID клубов для использования в запросе игроков
      const clubIds = clubsResult.map(club => club.id);
      console.log('ID клубов в федерации:', clubIds);
      
      // Упрощенный запрос игроков - получаем всех игроков из всех клубов этой федерации
      const playersResult = await sql`
        SELECT 
          p.*,
          c.name AS club_name,
          -- Статистика игр
          COALESCE(
            (SELECT COUNT(*) FROM game_players gp WHERE gp.player_id = p.id), 0
          ) AS total_games,
          -- Победы
          COALESCE(
            (SELECT COUNT(*) 
             FROM game_players gp 
             JOIN games g ON gp.game_id = g.id 
             WHERE gp.player_id = p.id AND 
                  ((gp.role IN ('civilian', 'sheriff') AND g.result = 'civilians_win') OR 
                   (gp.role IN ('mafia', 'don') AND g.result = 'mafia_win'))
            ), 0
          ) AS total_wins,
          -- Процент побед
          CASE 
            WHEN (SELECT COUNT(*) FROM game_players gp WHERE gp.player_id = p.id) > 0 
            THEN ROUND((
                 (SELECT COUNT(*) 
                  FROM game_players gp 
                  JOIN games g ON gp.game_id = g.id 
                  WHERE gp.player_id = p.id AND 
                       ((gp.role IN ('civilian', 'sheriff') AND g.result = 'civilians_win') OR 
                        (gp.role IN ('mafia', 'don') AND g.result = 'mafia_win'))
                 )::float / 
                 (SELECT COUNT(*) FROM game_players gp WHERE gp.player_id = p.id)
               ) * 100) 
            ELSE 0 
          END AS overall_winrate
        FROM 
          players p
        JOIN 
          clubs c ON p.club_id = c.id
        WHERE 
          c.federation_id = ${federationId}
        ORDER BY 
          p.name ASC, p.surname ASC
      `;
      
      console.log(`Найдено игроков: ${playersResult.length}`);
      
      if (!playersResult || playersResult.length === 0) {
        return NextResponse.json([])
      }

      // Проходим по результатам и структурируем данные
      const players = playersResult.map(player => ({
        ...player,
        stats: {
          total_games: player.total_games || 0,
          total_wins: player.total_wins || 0,
          overall_winrate: player.overall_winrate || 0
        }
      }))

      return NextResponse.json(players)
    } catch (sqlError) {
      console.error("SQL error:", sqlError)
      return NextResponse.json({ 
        error: "Database error", 
        details: String(sqlError)
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Error fetching federation players:", error)
    return NextResponse.json({ 
      error: "Failed to fetch federation players", 
      details: String(error) 
    }, { status: 500 })
  }
}
