import { neon } from "@neondatabase/serverless"
import * as fs from 'fs'
import * as path from 'path'

// Функция для чтения значения DATABASE_URL из файла .env
function getDatabaseUrlFromEnvFile(): string {
  try {
    // Путь к файлу .env
    const envPath = path.resolve(process.cwd(), '.env')
    
    // Проверяем, существует ли файл
    if (!fs.existsSync(envPath)) {
      console.error('Файл .env не найден')
      return ''
    }
    
    // Читаем содержимое файла
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    // Ищем строку с DATABASE_URL
    const matches = envContent.match(/DATABASE_URL=(.+)/)
    
    if (matches && matches[1]) {
      return matches[1].trim()
    } else {
      console.error('DATABASE_URL не найден в файле .env')
      return ''
    }
  } catch (error) {
    console.error('Ошибка при чтении файла .env:', error)
    return ''
  }
}

// Получаем переменную DATABASE_URL из файла .env
const DATABASE_URL = getDatabaseUrlFromEnvFile()

async function checkFederations() {
  console.log("Проверка таблицы федераций...")
  
  if (!DATABASE_URL) {
    console.error("Ошибка: Не удалось получить DATABASE_URL из файла .env")
    process.exit(1)
  }
  
  console.log("DATABASE_URL получен из файла .env")
  
  const sql = neon(DATABASE_URL)
  
  try {
    // Проверяем существование таблицы
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'federations'
      ) AS "exists"
    `
    
    console.log("Таблица 'federations' существует:", tableCheck[0]?.exists)
    
    if (tableCheck[0]?.exists) {
      // Получаем структуру таблицы
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'federations'
      `
      
      console.log("Структура таблицы 'federations':")
      columns.forEach((col: any) => {
        console.log(`  ${col.column_name}: ${col.data_type}`)
      })
      
      // Получаем данные из таблицы
      const data = await sql`
        SELECT * FROM federations 
        ORDER BY name
      `
      
      console.log(`\nДанные из таблицы 'federations' (${data.length} записей):`)
      data.forEach((fed: any, index: number) => {
        console.log(`\n[${index + 1}] Федерация:`)
        Object.entries(fed).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
      
      // Проверяем кол-во клубов для каждой федерации
      console.log("\nПроверка связанных данных:")
      for (const fed of data) {
        const clubs = await sql`
          SELECT COUNT(*) as count FROM clubs 
          WHERE federation_id = ${fed.id}
        `
        console.log(`Федерация "${fed.name}" (ID: ${fed.id}): ${clubs[0]?.count || 0} клубов`)
      }
    }
    
    // Проверяем результат запроса с сабселектами
    console.log("\nПроверка запроса API федераций:")
    const apiQuery = await sql`
      SELECT f.*, 
             (SELECT COUNT(*) FROM clubs c WHERE c.federation_id = f.id) as club_count,
             (SELECT COUNT(*) FROM players p JOIN clubs c ON p.club_id = c.id WHERE c.federation_id = f.id) as player_count
      FROM federations f
      ORDER BY f.name ASC
    `
    
    console.log(`Результат запроса API: ${apiQuery.length} записей`)
    console.log(JSON.stringify(apiQuery, null, 2))
    
  } catch (error) {
    console.error("Ошибка при проверке федераций:", error)
  }
}

checkFederations().catch(console.error)
