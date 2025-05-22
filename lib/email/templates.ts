// Email templates

/**
 * Email template for confirmation
 * @param {string} name - User name
 * @param {string} confirmationUrl - URL for confirmation action
 * @param {string} action - Type of action (e.g., "registration" or "password reset")
 * @returns {string} - HTML content of the email
 */
export function confirmationEmailTemplate({
  name,
  confirmationUrl,
  action = 'регистрацию',
}: {
  name: string;
  confirmationUrl: string;
  action?: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтвердите ${action}</title>
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
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4F46E5;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 20px 0;
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
      <h1>Подтвердите вашу ${action}</h1>
    </div>
    <div class="content">
      <p>Здравствуйте, ${name}!</p>
      <p>Спасибо за использование нашего сервиса. Для завершения ${action === 'регистрацию' ? 'регистрации' : action} необходимо подтвердить ваш адрес электронной почты.</p>
      <p>Пожалуйста, нажмите на кнопку ниже для подтверждения:</p>
      <a href="${confirmationUrl}" class="button">Подтвердить</a>
      <p>Если вы не запрашивали это действие, пожалуйста, проигнорируйте это письмо.</p>
      <p>Если кнопка не работает, вы можете скопировать и вставить следующую ссылку в ваш браузер:</p>
      <p>${confirmationUrl}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Game Form. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Шаблон текстовой версии письма с подтверждением (для клиентов без поддержки HTML)
 * @param {string} name - Имя пользователя
 * @param {string} confirmationUrl - URL для подтверждения действия
 * @param {string} action - Тип действия (например, "регистрация" или "сброс пароля")
 * @returns {string} - Текстовый контент письма
 */
export function confirmationEmailTextTemplate({
  name,
  confirmationUrl,
  action = 'регистрацию',
}: {
  name: string;
  confirmationUrl: string;
  action?: string;
}) {
  return `
Здравствуйте, ${name}!

Спасибо за использование нашего сервиса. Для завершения ${action === 'регистрацию' ? 'регистрации' : action} необходимо подтвердить ваш адрес электронной почты.

Пожалуйста, перейдите по следующей ссылке для подтверждения:
${confirmationUrl}

Если вы не запрашивали это действие, пожалуйста, проигнорируйте это письмо.

© ${new Date().getFullYear()} Game Form. Все права защищены.
  `;
}
