import { neon } from "@neondatabase/serverless";

/**
 * Миграция для добавления полей из таблицы players в таблицу users
 */
export async function addPlayerFieldsToUsers() {
  try {
    console.log("Запуск миграции: Добавление полей игрока в таблицу users...");
    
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL не определён в переменных окружения");
    }
    
    const sql = neon(databaseUrl);
    
    // Проверяем наличие полей перед их добавлением
    const checkColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('surname', 'nickname', 'country', 'club_id', 'birthday', 'gender', 'is_tournament_judge', 'is_side_judge', 'bio')
    `;
    
    const existingColumns = checkColumns.map(col => col.column_name);
    console.log("Существующие поля игрока:", existingColumns);
    
    // Добавляем только те поля, которых еще нет
    if (!existingColumns.includes('surname')) {
      console.log("Добавление поля surname...");
      await sql`ALTER TABLE users ADD COLUMN surname VARCHAR(100)`;
    }
    
    if (!existingColumns.includes('nickname')) {
      console.log("Добавление поля nickname...");
      await sql`ALTER TABLE users ADD COLUMN nickname VARCHAR(100)`;
    }
    
    if (!existingColumns.includes('country')) {
      console.log("Добавление поля country...");
      await sql`ALTER TABLE users ADD COLUMN country VARCHAR(100)`;
    }
    
    if (!existingColumns.includes('club_id')) {
      console.log("Добавление поля club_id...");
      await sql`ALTER TABLE users ADD COLUMN club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL`;
    }
    
    if (!existingColumns.includes('birthday')) {
      console.log("Добавление поля birthday...");
      await sql`ALTER TABLE users ADD COLUMN birthday TIMESTAMP WITH TIME ZONE`;
    }
    
    if (!existingColumns.includes('gender')) {
      console.log("Добавление поля gender...");
      await sql`ALTER TABLE users ADD COLUMN gender VARCHAR(20)`;
    }
    
    if (!existingColumns.includes('is_tournament_judge')) {
      console.log("Добавление поля is_tournament_judge...");
      await sql`ALTER TABLE users ADD COLUMN is_tournament_judge BOOLEAN DEFAULT FALSE`;
    }
    
    if (!existingColumns.includes('is_side_judge')) {
      console.log("Добавление поля is_side_judge...");
      await sql`ALTER TABLE users ADD COLUMN is_side_judge BOOLEAN DEFAULT FALSE`;
    }
    
    if (!existingColumns.includes('bio')) {
      console.log("Добавление поля bio...");
      await sql`ALTER TABLE users ADD COLUMN bio TEXT`;
    }
    
    console.log("Миграция успешно выполнена!");
    return { success: true };
  } catch (error) {
    console.error("Ошибка при выполнении миграции:", error);
    return { success: false, error };
  }
}
