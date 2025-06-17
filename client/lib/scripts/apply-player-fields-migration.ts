#!/usr/bin/env ts-node

/**
 * Скрипт для диагностики и применения миграции полей игрока к таблице users
 * Этот скрипт можно запустить напрямую через CLI для более подробных логов и диагностики
 */

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// Загрузка переменных окружения из .env
dotenv.config();

async function applyPlayerFieldsMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("ОШИБКА: DATABASE_URL не определён в переменных окружения");
    process.exit(1);
  }
  
  console.log("Инициализация соединения с PostgreSQL...");
  
  try {
    const sql = neon(databaseUrl);
    
    // Проверка соединения с базой данных
    console.log("Проверка соединения с базой данных...");
    const testConnection = await sql`SELECT 1 as connection_test`;
    
    if (testConnection[0]?.connection_test === 1) {
      console.log("✅ Соединение с базой данных установлено успешно.");
    } else {
      throw new Error("Не удалось проверить соединение с базой данных.");
    }
    
    // Проверка существования таблицы users
    console.log("Проверка существования таблицы users...");
    const checkUsersTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as table_exists
    `;
    
    if (!checkUsersTable[0]?.table_exists) {
      throw new Error("Таблица 'users' не существует в базе данных!");
    }
    
    console.log("✅ Таблица users существует.");
    
    // Проверка существования таблицы clubs (для внешнего ключа)
    console.log("Проверка существования таблицы clubs...");
    const checkClubsTable = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clubs'
      ) as table_exists
    `;
    
    if (!checkClubsTable[0]?.table_exists) {
      throw new Error("Таблица 'clubs' не существует, но требуется для внешнего ключа!");
    }
    
    console.log("✅ Таблица clubs существует.");
    
    // Проверяем наличие полей перед их добавлением
    console.log("Проверка существующих полей в таблице users...");
    const checkColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('surname', 'nickname', 'country', 'club_id', 'birthday', 'gender', 'is_tournament_judge', 'is_side_judge')
    `;
    
    const existingColumns = checkColumns.map(col => col.column_name);
    console.log("Существующие поля игрока:", existingColumns);
    
    // Добавляем только те поля, которых еще нет
    if (!existingColumns.includes('surname')) {
      console.log("➕ Добавление поля surname...");
      await sql`ALTER TABLE users ADD COLUMN surname VARCHAR(100)`;
    }
    
    if (!existingColumns.includes('nickname')) {
      console.log("➕ Добавление поля nickname...");
      await sql`ALTER TABLE users ADD COLUMN nickname VARCHAR(100)`;
    }
    
    if (!existingColumns.includes('country')) {
      console.log("➕ Добавление поля country...");
      await sql`ALTER TABLE users ADD COLUMN country VARCHAR(100)`;
    }
    
    // Для внешнего ключа используем более безопасный подход
    if (!existingColumns.includes('club_id')) {
      console.log("➕ Добавление поля club_id с внешним ключом...");
      try {
        await sql`ALTER TABLE users ADD COLUMN club_id INTEGER`;
        await sql`ALTER TABLE users ADD CONSTRAINT fk_users_club_id FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE SET NULL`;
      } catch (error) {
        console.error("Ошибка при добавлении внешнего ключа club_id:", error);
        console.log("Добавляем поле club_id без внешнего ключа...");
        await sql`ALTER TABLE users ADD COLUMN club_id INTEGER`;
      }
    }
    
    if (!existingColumns.includes('birthday')) {
      console.log("➕ Добавление поля birthday...");
      await sql`ALTER TABLE users ADD COLUMN birthday TIMESTAMP WITH TIME ZONE`;
    }
    
    if (!existingColumns.includes('gender')) {
      console.log("➕ Добавление поля gender...");
      await sql`ALTER TABLE users ADD COLUMN gender VARCHAR(20)`;
    }
    
    if (!existingColumns.includes('is_tournament_judge')) {
      console.log("➕ Добавление поля is_tournament_judge...");
      await sql`ALTER TABLE users ADD COLUMN is_tournament_judge BOOLEAN DEFAULT FALSE`;
    }
    
    if (!existingColumns.includes('is_side_judge')) {
      console.log("➕ Добавление поля is_side_judge...");
      await sql`ALTER TABLE users ADD COLUMN is_side_judge BOOLEAN DEFAULT FALSE`;
    }
    
    console.log("✅ Миграция успешно выполнена!");
    
    // Проверяем, что все поля были успешно добавлены
    const finalCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('surname', 'nickname', 'country', 'club_id', 'birthday', 'gender', 'is_tournament_judge', 'is_side_judge')
    `;
    
    const addedColumns = finalCheck.map(col => col.column_name);
    console.log("Подтверждение добавленных полей:", addedColumns);
    
    return { success: true };
  } catch (error) {
    console.error("❌ ОШИБКА при выполнении миграции:", error);
    return { success: false, error };
  }
}

// Запуск миграции, если скрипт вызван напрямую
if (require.main === module) {
  applyPlayerFieldsMigration()
    .then(result => {
      if (result.success) {
        console.log("Миграция завершена успешно!");
        process.exit(0);
      } else {
        console.error("Миграция завершилась с ошибкой:", result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error("Непредвиденная ошибка:", error);
      process.exit(1);
    });
}

export { applyPlayerFieldsMigration };
