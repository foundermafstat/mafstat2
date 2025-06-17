"use client"

import { useState, useEffect, useCallback } from "react"

/**
 * Хук для загрузки данных с сервера с улучшенной обработкой ошибок
 * @param url URL для запроса данных
 * @param initialData Начальные данные (опционально)
 * @param autoFetch Автоматически загружать данные при монтировании (по умолчанию true)
 */
export function useData<T>(url: string, initialData: T | null = null, autoFetch = true) {
  const [data, setData] = useState<T | null>(initialData)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<Error | null>(null)
  const [statusCode, setStatusCode] = useState<number | null>(null)

  /**
   * Функция для загрузки данных
   * @param fetchUrl опциональный URL для загрузки (если отличается от основного)
   * @param options опциональные параметры fetch
   */
  const fetchData = useCallback(async (fetchUrl?: string, options?: RequestInit) => {
    const targetUrl = fetchUrl || url
    try {
      setIsLoading(true)
      setError(null)
      console.log(`Загрузка данных с ${targetUrl}...`)

      // Добавляем кэш-бастер для избежания кэширования в разработке
      const urlWithCacheBuster = process.env.NODE_ENV === 'development' 
        ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}_cb=${Date.now()}` 
        : targetUrl

      const response = await fetch(urlWithCacheBuster, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...(options?.headers || {})
        }
      })

      // Сохраняем статус-код ответа
      setStatusCode(response.status)

      // Если статус 404, обрабатываем отдельно, так как это может быть ожидаемым
      if (response.status === 404) {
        console.warn(`Ресурс не найден: ${targetUrl}`)
        setData(null)
        
        try {
          // Пробуем получить подробную информацию об ошибке
          const errorData = await response.json()
          setError(new Error(errorData.message || `Ресурс не найден (404): ${targetUrl}`))
        } catch (e) {
          setError(new Error(`Ресурс не найден (404): ${targetUrl}`))
        }
        
        return null
      }

      // Проверяем другие ошибки HTTP
      if (!response.ok) {
        let errorMessage = `Ошибка HTTP! Статус: ${response.status}`
        try {
          // Попробуем получить сообщение об ошибке из JSON-ответа
          const errorData = await response.json()
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message
          }
        } catch (e) {
          // Если не получается распарсить JSON, используем стандартное сообщение
        }
        throw new Error(errorMessage)
      }

      // Проверяем тип контента для JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Ожидался JSON-ответ, получен ${contentType}`)
        throw new Error(`Ожидался JSON-ответ, получен ${contentType || 'неизвестный формат'}`)
      }

      const responseData = await response.json()
      console.log(`Данные получены с ${targetUrl}:`, responseData)

      // Проверяем новый формат ответа API с полями success и data
      if (responseData && typeof responseData === 'object' && 'success' in responseData) {
        if (responseData.success === true && responseData.data) {
          // Если успех, используем поле data
          setData(responseData.data as T)
          return responseData.data
        }
        if (responseData.success === false) {
          // Если ошибка, используем поля error и message
          throw new Error(responseData.message || responseData.error || 'Неизвестная ошибка')
        }
      }

      // Старый формат ответа API или прямой объект данных
      setData(responseData as T)
      return responseData
    } catch (err) {
      console.error(`Ошибка при загрузке с ${targetUrl}:`, err)
      setError(err instanceof Error ? err : new Error("Произошла неизвестная ошибка"))
      // Возвращаем безопасное значение по умолчанию
      setData(Array.isArray({} as T) ? ([] as unknown as T) : null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [url])

  // Эффект для автоматической загрузки данных при монтировании
  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [fetchData, autoFetch])

  // Функция для ручного обновления данных
  const refresh = useCallback(() => fetchData(), [fetchData])

  return { 
    data, 
    isLoading, 
    error, 
    statusCode,
    refresh,
    fetchData 
  }
}
