import { Request, Response } from 'express';
import { prisma } from '../utils/db';
import { hashPassword, comparePasswords, generateToken, generateRefreshToken } from '../utils/auth';
import { add } from 'date-fns';
import config from '../config';

// Регистрация нового пользователя
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Проверяем, существует ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ message: 'Пользователь с таким email уже существует' });
      return;
    }

    // Проверяем, существует ли пользователь с таким nickname (замена username), если он предоставлен
    if (username) {
      const userWithNickname = await prisma.user.findFirst({
        where: { nickname: username }
      });

      if (userWithNickname) {
        res.status(400).json({ message: 'Пользователь с таким username уже существует' });
        return;
      }
    }

    // Хешируем пароль
    const hashedPassword = await hashPassword(password);

    // Создаем пользователя
    // Используем firstName + lastName как name, и username как nickname
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : (username || 'User'), 
        nickname: username,
        surname: lastName
      }
    });

    // Генерируем токены
    const accessToken = generateToken(newUser);
    const refreshToken = generateRefreshToken();

    // Сохраняем refresh token в базе
    const expiresAt = add(new Date(), { days: 30 }); // 30 дней
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt
      }
    });

    // Отправляем ответ без конфиденциальных данных
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
};

// Вход пользователя
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Находим пользователя по email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ message: 'Неверный email или пароль' });
      return;
    }
    
    if (!user.password) {
       res.status(401).json({ message: 'Пользователь зарегистрирован через социальную сеть. Используйте вход через соцсеть.' });
       return;
    }

    // Проверяем пароль
    const isPasswordValid = await comparePasswords(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Неверный email или пароль' });
      return;
    }

    // Генерируем токены
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken();

    // Сохраняем refresh token в базе
    const expiresAt = add(new Date(), { days: 30 }); // 30 дней
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    // Отправляем ответ без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
};

// OAuth вход (или регистрация)
export const oauthLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, image, provider, providerAccountId } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email обязателен для OAuth входа' });
      return;
    }

    // 1. Ищем аккаунт по провайдеру
    if (provider && providerAccountId) {
      // Используем findFirst, так как составной ключ в Account это @@unique([provider, providerAccountId])
      // Но Prisma генерирует уникальный индекс provider_providerAccountId
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId
          }
        },
        include: { user: true }
      });

      if (account && account.user) {
        // Пользователь найден, генерируем токены
        const accessToken = generateToken(account.user);
        const refreshToken = generateRefreshToken();

        const expiresAt = add(new Date(), { days: 30 });
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: account.user.id,
            expiresAt
          }
        });

        const { password: _, ...userWithoutPassword } = account.user;
        res.status(200).json({
          user: userWithoutPassword,
          accessToken,
          refreshToken
        });
        return;
      }
    }

    // 2. Если аккаунт не найден, ищем пользователя по email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Пользователь найден, создаем привязку аккаунта (если есть данные)
      if (provider && providerAccountId) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider,
            providerAccountId
          }
        });
      }
    } else {
      // Пользователь не найден, создаем нового
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          image,
          emailVerified: new Date(),
          role: 'user' // Corrected from 'user' to default string if needed, but 'user' is fine as string
        }
      });

      if (provider && providerAccountId) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: 'oauth',
            provider,
            providerAccountId
          }
        });
      }
    }

    // Генерируем токены
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken();

    const expiresAt = add(new Date(), { days: 30 });
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      user: userWithoutPassword,
      accessToken,
      refreshToken
    });

  } catch (error) {
     console.error('Ошибка при OAuth входе:', error);
    res.status(500).json({ message: 'Ошибка сервера при OAuth входе' });
  }
};

// Обновление токена доступа
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token не предоставлен' });
      return;
    }

    // Находим токен в базе
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      res.status(401).json({ message: 'Недействительный refresh token' });
      return;
    }

    // Проверяем срок действия
    if (new Date() > storedToken.expiresAt) {
      // Удаляем просроченный токен
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      res.status(401).json({ message: 'Refresh token истек' });
      return;
    }

    // Генерируем новый access token
    const newAccessToken = generateToken(storedToken.user);

    res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении токена' });
  }
};

// Получение профиля пользователя
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Не авторизован' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    // Отправляем данные пользователя без пароля
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля' });
  }
};

// Выход пользователя
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Удаляем refresh token из базы
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    }

    res.status(200).json({ message: 'Выход выполнен успешно' });
  } catch (error) {
    console.error('Ошибка при выходе:', error);
    res.status(500).json({ message: 'Ошибка сервера при выходе' });
  }
};
