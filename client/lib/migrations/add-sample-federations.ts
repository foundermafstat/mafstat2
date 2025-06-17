import { neon } from "@neondatabase/serverless"

/**
 * Добавляет примеры федераций в базу данных, если они еще не существуют
 */
export async function addSampleFederations() {
  console.log("Запуск миграции: добавление примеров федераций")
  
  const sql = neon(process.env.DATABASE_URL || "")
  
  try {
    // Проверяем существование таблицы федераций
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'federations'
      ) AS "exists"
    `
    
    if (!tableCheck[0]?.exists) {
      console.log("Таблица 'federations' не существует, создаем...")
      
      // Создаем таблицу федераций
      await sql`
        CREATE TABLE IF NOT EXISTS federations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          country VARCHAR(255),
          city VARCHAR(255),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log("Таблица 'federations' создана")
    } else {
      console.log("Таблица 'federations' уже существует")
    }
    
    // Проверяем, есть ли уже федерации в таблице
    const count = await sql`SELECT COUNT(*) FROM federations`
    const federationsCount = Number(count[0]?.count || 0)
    
    if (federationsCount === 0) {
      console.log("Федерации не найдены, добавляем тестовые данные...")
      
      // Добавляем тестовые федерации
      await sql`
        INSERT INTO federations (name, country, city, description) VALUES
        ('Российская федерация настольных игр', 'Россия', 'Москва', 'Крупнейшая федерация настольных игр в России'),
        ('Европейская ассоциация игр', 'Германия', 'Берлин', 'Объединяет игроков из стран Европы'),
        ('Азиатская федерация игр', 'Япония', 'Токио', 'Продвижение настольных игр в азиатском регионе'),
        ('Американская лига игр', 'США', 'Нью-Йорк', 'Организация турниров по настольным играм в США'),
        ('Международная федерация игр', 'Швейцария', 'Женева', 'Глобальная организация, объединяющая национальные федерации')
      `
      
      console.log("Тестовые федерации добавлены")
    } else {
      console.log(`В базе данных уже есть ${federationsCount} федераций, пропускаем добавление`)
    }
    
    return { success: true, message: "Миграция выполнена успешно" }
  } catch (error) {
    console.error("Ошибка при выполнении миграции федераций:", error)
    return { 
      success: false, 
      message: "Ошибка при выполнении миграции", 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
}
