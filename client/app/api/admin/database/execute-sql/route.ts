import { query, rawQuery } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Вы должны быть авторизованы для выполнения этого действия' },
        { status: 401 }
      )
    }

    // Проверка наличия прав администратора
    if (session.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'У вас нет прав на выполнение этого действия' },
        { status: 403 }
      )
    }

    // Получение SQL-запроса из тела запроса
    const { query: sql } = await request.json()

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL-запрос не может быть пустым' },
        { status: 400 }
      )
    }

    // Измерение времени выполнения запроса
    const startTime = performance.now()
    
    // Определение типа запроса
    const queryType = sql.trim().toLowerCase().split(' ')[0]
    
    // Для DDL запросов используем rawQuery
    const isDDL = ['create', 'alter', 'drop'].includes(queryType)
    
    // Выполнение SQL-запроса
    let result
    if (isDDL) {
      // Используем rawQuery для DDL запросов
      result = await rawQuery(sql)
    } else {
      // Используем обычный query для остальных запросов
      result = await query(sql)
    }
    
    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    // Для SELECT запроса возвращаем результаты и информацию о столбцах
    const isSelectQuery = queryType === 'select'
    
    if (isSelectQuery) {
      // Если результат - массив объектов, получаем имена столбцов
      const columns = result.length > 0 ? Object.keys(result[0]) : []
      
      return NextResponse.json({
        success: true,
        rows: result,
        columns,
        duration,
        message: `Запрос выполнен успешно. Получено ${result.length} строк.`
      })
    }
    
    // Для других типов запросов (INSERT, UPDATE, DELETE, CREATE и т.д.)
    return NextResponse.json({
      success: true,
      affectedRows: result.rowCount || 0,
      duration,
      message: `Запрос ${queryType.toUpperCase()} выполнен успешно.`
    })
  } catch (error) {
    console.error('Ошибка при выполнении SQL-запроса:', error)
    
    // Формирование понятного сообщения об ошибке для пользователя
    let errorMessage = 'Произошла ошибка при выполнении запроса'
    
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}
