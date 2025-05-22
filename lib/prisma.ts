import { PrismaClient } from '@prisma/client'

// Предотвращаем создание множества подключений в режиме разработки
// Глобальная переменная для хранения экземпляра PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Экспортируем единый экземпляр PrismaClient
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// В режиме разработки сохраняем prisma в глобальной переменной
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Типы для настроек функции prismaOperation
 */
export type PrismaOperationOptions<T> = {
  errorMsg?: string;
  fallbackValue?: T;
  onZodError?: (error: unknown) => T;
}

/**
 * Утилита для выполнения Prisma операций с автоматической обработкой ошибок
 * @param operation Функция, выполняющая операцию с Prisma
 * @param options Опции для обработки ошибок и возврата fallback значений
 * @returns Результат операции или fallback значение в случае ошибки
 */
export async function prismaOperation<T>(
  operation: () => Promise<T>,
  options?: string | PrismaOperationOptions<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    console.error('Prisma Operation Error:', error)
    
    // Обработка опций: строка или объект
    const errorMsg = typeof options === 'string'
      ? options
      : options?.errorMsg || 'Ошибка при работе с базой данных'
    
    // Проверяем, является ли ошибка связанной с Zod
    if (typeof options === 'object' && options?.onZodError && error && 
        typeof error === 'object' && 'errors' in error) {
      return options.onZodError(error)
    }
    
    // Если есть fallbackValue в options, возвращаем его
    if (typeof options === 'object' && 'fallbackValue' in options) {
      return options.fallbackValue as T
    }
    
    // Иначе выбрасываем ошибку
    throw new Error(`${errorMsg}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Транзакция Prisma для атомарных операций
 * @param operations Функция, которая содержит все операции в транзакции
 * @returns Результат транзакции
 */
export async function prismaTransaction<T>(
  operations: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prismaOperation(
    () => prisma.$transaction(async (tx) => await operations(tx as unknown as PrismaClient)),
    'Ошибка транзакции'
  )
}
