import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename: filenameParam } = await params
    const filename = decodeURIComponent(filenameParam)
    const musicDir = join(process.cwd(), 'uploads', 'music')
    const filePath = join(musicDir, filename)
    
    // Проверяем, что файл существует и находится в правильной директории
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 }
      )
    }
    
    // Проверяем, что путь не выходит за пределы директории музыки (защита от path traversal)
    if (!filePath.startsWith(musicDir)) {
      return NextResponse.json(
        { error: 'Неверный путь к файлу' },
        { status: 400 }
      )
    }
    
    // Читаем файл
    const fileBuffer = await readFile(filePath)
    
    // Определяем MIME-тип на основе расширения
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac',
    }
    const contentType = mimeTypes[ext || ''] || 'audio/mpeg'
    
    // Возвращаем файл с правильными заголовками
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Ошибка при получении файла музыки:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении файла музыки' },
      { status: 500 }
    )
  }
}

