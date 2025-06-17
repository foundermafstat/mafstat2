import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Получаем токен из URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 400 }
      );
    }

    // Подключаемся к базе данных
    const sql = neon(process.env.DATABASE_URL || '');
    
    // Проверяем существует ли токен и не истёк ли он
    const tokens = await sql`
      SELECT prt.id, prt.user_id, prt.expires_at, u.email
      FROM password_reset_tokens prt
      JOIN users u ON prt.user_id = u.id
      WHERE prt.token = ${token}
        AND prt.expires_at > NOW()
    `;
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Недействительный или устаревший токен для сброса пароля' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { valid: true, email: tokens[0].email },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при проверке токена:', error);
    
    return NextResponse.json(
      { error: 'Произошла ошибка при проверке токена. Пожалуйста, попробуйте снова позже.' },
      { status: 500 }
    );
  }
}
