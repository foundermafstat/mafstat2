import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// Initialize neon client
let neonClient: any = null
let drizzleClient: any = null

/**
 * Get a neon SQL client
 */
export function getNeon() {
  if (!neonClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined")
    }

    neonClient = neon(process.env.DATABASE_URL)
  }

  return neonClient
}

/**
 * Get a Drizzle ORM client for the database
 */
export function getDrizzle() {
  if (!drizzleClient) {
    const sql = getNeon()
    drizzleClient = drizzle(sql)
  }

  return drizzleClient
}

/**
 * Execute a SQL query using tagged template literals or parameterized query
 */
export async function query(strings: TemplateStringsArray | string, ...values: any[]) {
  try {
    const sql = getNeon()
    console.log("SQL Query:", typeof strings === "string" ? strings : strings.join('?'), 
               "Params:", JSON.stringify(values))

    // If it's a template string, use tagged template syntax
    if (typeof strings === "object" && Array.isArray(strings.raw)) {
      return await sql(strings, ...values)
    }

    // В простом строковом запросе (не template string), values приходит как массив с одним элементом,
    // который является массивом параметров. Нужно достать внутренний массив.
    if (values.length === 1 && Array.isArray(values[0])) {
      // Преобразуем параметры в правильный формат для PostgreSQL, если это ID
      const processedParams = values[0].map(value => {
        // Если значение похоже на ID (строка с числом), преобразуем в число
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          return parseInt(value, 10)
        }
        return value
      })
      
      console.log("Using processed params:", JSON.stringify(processedParams))
      const result = await sql.query(strings, processedParams)
      console.log("Query result:", JSON.stringify(result))
      return result
    }
    
    // Иначе используем параметры как есть
    const result = await sql.query(strings, values)
    console.log("Query result:", JSON.stringify(result))
    return result
  } catch (error) {
    console.error("Database query error:", error)
    // Пробрасываем ошибку дальше для обработки в API
    throw error
  }
}

/**
 * Execute a parameterized SQL query with proper parameter handling
 */
export async function paramQuery(queryText: string, params: any[] = []) {
  const sql = getNeon()
  return await sql.query(queryText, params)
}

/**
 * Execute a raw SQL query without prepared statements
 * Полезно для выполнения DDL команд (CREATE TABLE, CREATE INDEX, etc.)
 */
export async function rawQuery(sqlQuery: string) {
  try {
    // Получаем строку подключения к базе данных из окружения
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined")
    }
    
    console.log("Executing raw SQL:", sqlQuery)
    
    // Вместо getNeon() будем использовать прямое подключение к базе данных
    // с использованием @neondatabase/serverless
    const { Pool } = require('@neondatabase/serverless')
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    
    // Выполняем запрос напрямую через Pool, который не использует prepared statements
    // для простых запросов 
    const result = await pool.query(sqlQuery)
    
    console.log("Raw query result:", JSON.stringify(result))
    return result
  } catch (error) {
    console.error("Database raw query error:", error)
    throw error
  }
}
