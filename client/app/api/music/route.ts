import { NextResponse } from "next/server"
import { readdir } from "fs/promises"
import { join } from "path"

export async function GET() {
  try {
    // Путь к директории с музыкой относительно корня проекта (client)
    const musicDir = join(process.cwd(), 'uploads', 'music')
    
    // Читаем список файлов из директории
    const files = await readdir(musicDir)
    
    // Фильтруем только аудио файлы
    const audioFiles = files.filter(file => 
      /\.(mp3|wav|ogg|m4a|flac)$/i.test(file)
    )
    
    // Формируем список треков с путями
    const tracks = audioFiles.map(file => {
      // Убираем расширение и очищаем название от лишних символов
      let name = file.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '')
      // Убираем суффиксы типа _(mp3phoenix.net)
      name = name.replace(/\s*_\([^)]+\)\s*$/, '')
      // Заменяем подчеркивания на пробелы
      name = name.replace(/_/g, ' ')
      // Убираем множественные пробелы
      name = name.replace(/\s+/g, ' ').trim()
      
      return {
        name: name || file, // Если после обработки название пустое, используем оригинальное имя файла
        filename: file,
        src: `/api/music/play/${encodeURIComponent(file)}`, // Путь для воспроизведения
      }
    })
    
    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('Ошибка при получении списка музыки:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка музыки', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

