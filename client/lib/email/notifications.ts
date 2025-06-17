import { sendEmail } from './resend';
import { confirmationEmailTemplate, confirmationEmailTextTemplate } from './templates';

/**
 * Отправляет письмо с уведомлением о регистрации пользователя
 * @param {string} email - Email пользователя
 * @param {string} name - Имя пользователя
 * @param {string} confirmationUrl - URL для подтверждения регистрации (опционально)
 * @returns {Promise<{ success: boolean; error?: any; data?: any }>} - Результат отправки
 */
export async function sendRegistrationNotification({
  email,
  name,
  confirmationUrl,
}: {
  email: string;
  name: string;
  confirmationUrl?: string;
}) {
  const subject = 'Добро пожаловать! Подтвердите вашу регистрацию';
  
  // Если URL для подтверждения не передан, отправляем просто уведомление о регистрации
  const actionUrl = confirmationUrl || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`;
  const action = confirmationUrl ? 'регистрацию' : 'успешную регистрацию';
  
  const html = confirmationEmailTemplate({
    name,
    confirmationUrl: actionUrl,
    action,
  });
  
  const text = confirmationEmailTextTemplate({
    name,
    confirmationUrl: actionUrl,
    action,
  });
  
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Отправляет простое уведомление о регистрации без ссылки подтверждения
 * @param {string} email - Email пользователя
 * @param {string} name - Имя пользователя
 * @returns {Promise<{ success: boolean; error?: any; data?: any }>} - Результат отправки
 */
export async function sendSimpleRegistrationNotification({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  return sendRegistrationNotification({
    email,
    name,
  });
}

/**
 * Отправляет уведомление о входе в систему через OAuth провайдер
 * @param {string} email - Email пользователя
 * @param {string} name - Имя пользователя
 * @param {string} provider - Название провайдера (google, github, и т.д.)
 * @returns {Promise<{ success: boolean; error?: any; data?: any }>} - Результат отправки
 */
export async function sendLoginNotification({
  email,
  name,
  provider,
}: {
  email: string;
  name: string;
  provider: string;
}) {
  const subject = 'Успешный вход в систему';
  
  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Успешный вход в систему</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #4F46E5;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
      background-color: #f9f9f9;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Успешный вход в систему</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${name}!</p>
      <p>Вы успешно вошли в систему через ${providerName}.</p>
      <p>Если это были не вы, пожалуйста, немедленно измените пароль вашей учетной записи и свяжитесь с администрацией сайта.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Game Form. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
Здравствуйте, ${name}!

Вы успешно вошли в систему через ${providerName}.

Если это были не вы, пожалуйста, немедленно измените пароль вашей учетной записи и свяжитесь с администрацией сайта.

© ${new Date().getFullYear()} Game Form. Все права защищены.
  `;
  
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}
