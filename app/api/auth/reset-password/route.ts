import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    // Получаем токен и новый пароль из запроса
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Необходимо указать токен и новый пароль' },
        { status: 400 }
      );
    }

    // Проверяем длину пароля (минимум 8 символов)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    // Подключаемся к базе данных
    const sql = neon(process.env.DATABASE_URL || '');
    
    // Получаем токен и связанного пользователя
    const tokens = await sql`
      SELECT prt.id, prt.user_id, prt.expires_at
      FROM password_reset_tokens prt
      WHERE prt.token = ${token}
        AND prt.expires_at > NOW()
    `;
    
    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Недействительный или устаревший токен для сброса пароля' },
        { status: 400 }
      );
    }
    
    const userId = tokens[0].user_id;
    
    // Хешируем новый пароль
    const hashedPassword = await hash(password, 10);
    
    // Обновляем пароль пользователя
    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${userId}
    `;
    
    // Удаляем использованный токен
    await sql`
      DELETE FROM password_reset_tokens
      WHERE id = ${tokens[0].id}
    `;
    
    return NextResponse.json(
      { success: true, message: 'Пароль успешно изменен' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    
    return NextResponse.json(
      { error: 'Произошла ошибка при сбросе пароля. Пожалуйста, попробуйте снова позже.' },
      { status: 500 }
    );
  }
}
