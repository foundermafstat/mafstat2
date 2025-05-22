import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

// Настройка mailtrap для тестирования отправки писем
// В production нужно заменить на реальный SMTP-сервер
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.EMAIL_SERVER_PORT) || 2525,
  auth: {
    user: process.env.EMAIL_SERVER_USER || 'your_mailtrap_user',
    pass: process.env.EMAIL_SERVER_PASSWORD || 'your_mailtrap_password',
  },
});

export async function POST(request: Request) {
  try {
    // Получаем email из запроса
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email не указан' },
        { status: 400 }
      );
    }

    // Подключаемся к базе данных
    const sql = neon(process.env.DATABASE_URL || '');
    
    // Проверяем существует ли пользователь с таким email
    const users = await sql`
      SELECT id, email, name
      FROM users
      WHERE email = ${email.toLowerCase()}
    `;
    
    if (!users || users.length === 0) {
      // Не сообщаем, что пользователь не найден, чтобы избежать утечки информации
      return NextResponse.json(
        { success: true, message: 'Если указанный email существует, на него отправлена инструкция по сбросу пароля.' },
        { status: 200 }
      );
    }
    
    const user = users[0];
    
    // Генерируем случайный токен для сброса пароля
    const resetToken = randomBytes(32).toString('hex');
    // Срок действия токена - 1 час
    const expiresAt = new Date(Date.now() + 3600000); // +1 час
    
    // Сохраняем токен в базе данных
    // Сначала удаляем все старые токены для данного пользователя
    await sql`
      DELETE FROM password_reset_tokens
      WHERE user_id = ${user.id}
    `;
    
    // Затем добавляем новый токен
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `;
    
    // Формируем URL для сброса пароля
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Отправляем email с инструкциями
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@mafstat.com',
      to: user.email,
      subject: 'Восстановление пароля',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Восстановление пароля</h2>
          <p>Здравствуйте, ${user.name}!</p>
          <p>Мы получили запрос на сброс пароля для вашей учетной записи. Если это были не вы, просто проигнорируйте это письмо.</p>
          <p>Чтобы сбросить пароль, перейдите по следующей ссылке:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Сбросить пароль</a>
          </p>
          <p>Или скопируйте следующую ссылку в адресную строку браузера:</p>
          <p>${resetUrl}</p>
          <p>Ссылка действительна в течение 1 часа.</p>
          <p>С уважением,<br>Команда Mafstat</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json(
      { success: true, message: 'Инструкции по сбросу пароля отправлены на указанный email.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Ошибка при обработке запроса на сброс пароля:', error);
    
    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте снова позже.' },
      { status: 500 }
    );
  }
}
