import { query, getNeon } from "../lib/db";

/**
 * Скрипт для проверки данных федерации по ID
 */
async function checkFederationById(id: string) {
  try {
    console.log(`Проверяем федерацию с ID: ${id}`);
    
    // Проверяем существование федерации
    const existsResult = await query(`
      SELECT EXISTS (
        SELECT 1 FROM federations WHERE id = $1
      )
    `, [id]);
    console.log("Результат проверки существования:", existsResult?.rows);
    
    // Получаем полную информацию о федерации
    const federationData = await query(`
      SELECT * FROM federations WHERE id = $1
    `, [id]);
    console.log("Данные федерации:", federationData?.rows);
    
    // Проверяем структуру таблицы федераций
    const tableInfo = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'federations'
      ORDER BY ordinal_position
    `);
    console.log("Структура таблицы федераций:", tableInfo?.rows);
    
    // Получаем клубы федерации
    const clubsData = await query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM players p WHERE p.club_id = c.id) as player_count
      FROM clubs c
      WHERE c.federation_id = $1
    `, [id]);
    console.log("Клубы федерации:", clubsData?.rows);

    // Проверка имен таблиц в схеме
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log("Таблицы в базе данных:", tables?.rows);
    
  } catch (error) {
    console.error("Ошибка при проверке федерации:", error);
  }
}

// Проверяем федерацию с ID=3
checkFederationById("3");
