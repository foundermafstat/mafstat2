import { query } from "../lib/db"

async function runBioMigration() {
  try {
    // Проверяем, существует ли уже поле bio
    console.log("Проверка существования поля bio...")
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'bio'
    `
    const columnsResult = await query(checkColumnQuery)
    
    // Если поле уже существует, выходим
    if (columnsResult && columnsResult.length > 0) {
      console.log("Поле bio уже существует в таблице users")
      return
    }
    
    // Добавляем поле bio в таблицу users
    console.log("Добавление поля bio в таблицу users...")
    const addColumnQuery = `
      ALTER TABLE users 
      ADD COLUMN bio TEXT
    `
    
    await query(addColumnQuery)
    console.log("Поле bio успешно добавлено в таблицу users")
  } catch (error) {
    console.error("Ошибка при добавлении поля bio:", error)
    process.exit(1)
  }

  process.exit(0)
}

runBioMigration()
