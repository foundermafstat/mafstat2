import { query } from "../db"

/**
 * Миграция для добавления поля bio в таблицу users
 * Эта миграция проверяет существование поля перед добавлением
 */
export async function addBioFieldToUsers() {
  console.log("Запуск миграции: добавление поля bio в таблицу users")
  
  try {
    // Проверяем, существует ли уже поле bio
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `
    const columnsResult = await query(checkColumnQuery)
    
    // Если поле уже существует, выходим
    if (columnsResult && columnsResult.length > 0) {
      console.log("Поле bio уже существует в таблице users")
      return { success: true, message: "Поле bio уже существует" }
    }
    
    // Добавляем поле bio в таблицу users
    const addColumnQuery = `
      ALTER TABLE users 
      ADD COLUMN bio TEXT
    `
    
    await query(addColumnQuery)
    console.log("Поле bio успешно добавлено в таблицу users")
    
    return { success: true, message: "Поле bio успешно добавлено в таблицу users" }
  } catch (error) {
    console.error("Ошибка при добавлении поля bio:", error)
    
    return { 
      success: false, 
      message: "Ошибка при добавлении поля bio", 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}
