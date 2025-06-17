import { Resend } from 'resend';

// Инициализация Resend с API ключом
const resend = new Resend(process.env.RESEND_API_KEY);

// Функция для отправки электронного письма
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    // Проверка наличия ключа API
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY не найден в переменных окружения');
    }

    // Проверка email отправителя
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error('EMAIL_FROM не найден в переменных окружения');
    }

    // Отправка письма
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Ошибка отправки письма через Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
    return { success: false, error };
  }
}
