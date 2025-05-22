import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Начало заполнения базы данных тестовыми данными...')

  // Удаляем предыдущие данные, если они есть
  console.log('Удаление предыдущих тестовых данных...')
  await prisma.game.deleteMany() // Удаляем игры первыми из-за внешних ключей
  await prisma.user.deleteMany()
  await prisma.club.deleteMany()
  await prisma.federation.deleteMany()

  // 1. Создание федераций
  console.log('Создание федераций...')
  const federations = await Promise.all([
    prisma.federation.create({
      data: {
        name: 'Российская федерация мафии',
        description: 'Официальная федерация мафии России',
        url: 'https://mafiafed.ru',
        country: 'Россия',
        city: 'Москва',
        additionalPointsConditions: {
          bestPlayers: true,
          bestMove: true
        }
      }
    }),
    prisma.federation.create({
      data: {
        name: 'Европейская федерация мафии',
        description: 'Федерация, объединяющая европейские клубы',
        url: 'https://eumafia.org',
        country: 'ЕС',
        city: 'Брюссель',
        additionalPointsConditions: {
          bestPlayers: true,
          firstKill: true
        }
      }
    }),
    prisma.federation.create({
      data: {
        name: 'Украинская федерация мафии',
        description: 'Официальная федерация мафии Украины',
        url: 'https://mafiaclubua.com',
        country: 'Украина',
        city: 'Киев',
        additionalPointsConditions: {
          bestMove: true,
          firstKill: true
        }
      }
    })
  ])

  console.log(`Создано ${federations.length} федераций`)

  // 2. Создание клубов
  console.log('Создание клубов...')
  const clubs = await Promise.all([
    prisma.club.create({
      data: {
        name: 'Мафия Москва',
        description: 'Самый крупный клуб в Москве',
        url: 'https://mafiaclubmoscow.ru',
        country: 'Россия',
        city: 'Москва',
        federationId: federations[0].id
      }
    }),
    prisma.club.create({
      data: {
        name: 'Питерская мафия',
        description: 'Культурная мафия северной столицы',
        url: 'https://spbmafia.ru',
        country: 'Россия',
        city: 'Санкт-Петербург',
        federationId: federations[0].id
      }
    }),
    prisma.club.create({
      data: {
        name: 'Berliner Mafia',
        description: 'Немецкий клуб мафии',
        url: 'https://berlinmafia.de',
        country: 'Германия',
        city: 'Берлин',
        federationId: federations[1].id
      }
    }),
    prisma.club.create({
      data: {
        name: 'Mafia Kyiv',
        description: 'Киевский клуб мафии',
        url: 'https://mafiakyiv.ua',
        country: 'Украина',
        city: 'Киев',
        federationId: federations[2].id
      }
    }),
    prisma.club.create({
      data: {
        name: 'Paris Mafia Club',
        description: 'Парижский клуб мафии',
        url: 'https://parismafia.fr',
        country: 'Франция',
        city: 'Париж',
        federationId: federations[1].id
      }
    })
  ])

  console.log(`Создано ${clubs.length} клубов`)

  // 3. Создание пользователей
  console.log('Создание пользователей...')

  // Хешированный пароль '123456' для всех пользователей
  const hashedPassword = await hash('123456', 10)

  // Создание админа
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      role: 'admin',
      plan: 'FREE',
      premiumNights: 0,
      isTournamentJudge: true,
      isSideJudge: true,
    },
    create: {
      name: 'Администратор',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
      clubId: clubs[0].id,
      isTournamentJudge: true,
      isSideJudge: true,
      plan: 'FREE',
      premiumNights: 0
    }
  })

  // Создание премиум-пользователя
  const premiumUser = await prisma.user.upsert({
    where: { email: 'premium@test.com' },
    update: {
      role: 'premium',
      plan: 'PREMIUM',
      premiumNights: 30,
      planUpdatedAt: new Date()
    },
    create: {
      name: 'Максим',
      surname: 'Петров',
      nickname: 'MaxPlay',
      email: 'premium@test.com',
      password: hashedPassword,
      role: 'premium',
      emailVerified: new Date(),
      clubId: clubs[0].id,
      country: 'Россия',
      gender: 'male',
      isTournamentJudge: false,
      isSideJudge: false,
      plan: 'PREMIUM',
      premiumNights: 30,
      planUpdatedAt: new Date()
    }
  })

  // Создание обычных пользователей
  const users = await Promise.all([
    // Обычный пользователь 1
    prisma.user.upsert({
      where: { email: 'alex@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Алексей',
        surname: 'Иванов',
        nickname: 'MafBoss',
        email: 'alex@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[0].id,
        country: 'Россия',
        gender: 'male',
        isTournamentJudge: false,
        isSideJudge: true,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 2
    prisma.user.upsert({
      where: { email: 'maria@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Мария',
        surname: 'Смирнова',
        nickname: 'MariaMaf',
        email: 'maria@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[1].id,
        country: 'Россия',
        gender: 'female',
        isTournamentJudge: false,
        isSideJudge: false,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 3
    prisma.user.upsert({
      where: { email: 'ivan@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Иван',
        surname: 'Соколов',
        nickname: 'DonSokol',
        email: 'ivan@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[0].id,
        country: 'Россия',
        gender: 'male',
        isTournamentJudge: true,
        isSideJudge: false,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 4
    prisma.user.upsert({
      where: { email: 'elena@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Елена',
        surname: 'Козлова',
        nickname: 'MafiaQueen',
        email: 'elena@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[1].id,
        country: 'Россия',
        gender: 'female',
        isTournamentJudge: false,
        isSideJudge: false,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 5
    prisma.user.upsert({
      where: { email: 'hans@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Hans',
        surname: 'Schmidt',
        nickname: 'GermanDon',
        email: 'hans@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[2].id,
        country: 'Германия',
        gender: 'male',
        isTournamentJudge: true,
        isSideJudge: true,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 6
    prisma.user.upsert({
      where: { email: 'olga@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Olga',
        surname: 'Kovalenko',
        nickname: 'Sheriff',
        email: 'olga@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[3].id,
        country: 'Украина',
        gender: 'female',
        isTournamentJudge: false,
        isSideJudge: true,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 7
    prisma.user.upsert({
      where: { email: 'pierre@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Pierre',
        surname: 'Dubois',
        nickname: 'FrenchMafiosi',
        email: 'pierre@test.com',
        password: hashedPassword,
        role: 'user',
        emailVerified: new Date(),
        clubId: clubs[4].id,
        country: 'Франция',
        gender: 'male',
        isTournamentJudge: false,
        isSideJudge: false,
        plan: 'FREE',
        premiumNights: 0
      }
    }),
    // Обычный пользователь 8
    prisma.user.upsert({
      where: { email: 'dmitry@test.com' },
      update: {
        plan: 'FREE',
        premiumNights: 0
      },
      create: {
        name: 'Дмитрий',
        surname: 'Волков',
        nickname: 'Wolf',
        email: 'dmitry@test.com',
        password: hashedPassword,
        role: 'user',
        clubId: clubs[0].id,
        country: 'Россия',
        gender: 'male',
        isTournamentJudge: false,
        isSideJudge: false,
        plan: 'FREE',
        premiumNights: 0
      }
    })
  ])

  console.log(`Создано ${users.length + 2} пользователей (включая админа и премиум-пользователя)`)

  // 4. Создание игр
  console.log('Создание игр...')

  // Объединяем всех пользователей для простоты создания игр
  const allUsers = [admin, premiumUser, ...users]

  // Функция для получения случайного пользователя из списка
  const getRandomUser = () => allUsers[Math.floor(Math.random() * allUsers.length)]
  // Функция для получения случайных игроков для игры (исключая судью)
  const getRandomPlayers = (judge: typeof admin, count = 10) => {
    const players = []
    const availableUsers = allUsers.filter(u => u.id !== judge.id)
    
    for (let i = 0; i < Math.min(count, availableUsers.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableUsers.length)
      players.push(availableUsers.splice(randomIndex, 1)[0])
    }
    
    return players
  }

  // Создаем несколько игр
  const games = []
  
  // Игра 1 - Классическая
  const judge1 = allUsers.find(u => u.isTournamentJudge) || allUsers[0]
  const players1 = getRandomPlayers(judge1)
  
  // Дата для первой игры - 20 апреля 2025
  const date1 = new Date('2025-04-20')
  games.push(await prisma.game.create({
    data: {
      name: 'Классическая партия #1',
      gameType: 'classic',
      result: 'mafia_win',
      refereeId: judge1.id,
      clubId: clubs[0].id,
      refereeComments: 'Тестовая классическая игра',
      createdAt: date1,
      updatedAt: date1,
    }
  }))
  
  // Игра 2 - Турнирная
  const judge2 = allUsers.find(u => u.id !== judge1.id && u.isTournamentJudge) || allUsers[1]
  const players2 = getRandomPlayers(judge2)
  
  // Дата для второй игры - 25 апреля 2025
  const date2 = new Date('2025-04-25')
  games.push(await prisma.game.create({
    data: {
      name: 'Турнирная игра #1',
      gameType: 'tournament',
      result: 'town_win',
      refereeId: judge2.id,
      clubId: clubs[1].id,
      refereeComments: 'Тестовая турнирная игра',
      createdAt: date2,
      updatedAt: date2,
    }
  }))
  
  // Игра 3 - В процессе
  const judge3 = allUsers.find(u => u.isTournamentJudge && u.id !== judge1.id && u.id !== judge2.id) || allUsers[2]
  const players3 = getRandomPlayers(judge3)
  
  // Текущая дата для третьей игры
  const date3 = new Date()
  games.push(await prisma.game.create({
    data: {
      name: 'Текущая игра',
      gameType: 'classic',
      result: null, // игра в процессе, результата еще нет
      refereeId: judge3.id,
      clubId: clubs[0].id,
      refereeComments: 'Игра в процессе',
      createdAt: date3,
      updatedAt: date3,
    }
  }))
  
  // Игра 4 - Запланированная
  const judge4 = allUsers.find(u => u.isTournamentJudge && u.id !== judge1.id && u.id !== judge2.id && u.id !== judge3.id) || allUsers[3]
  const players4 = getRandomPlayers(judge4)
  
  // Дата для четвертой игры - в будущем
  const date4 = new Date()
  games.push(await prisma.game.create({
    data: {
      name: 'Будущая игра',
      gameType: 'tournament',
      result: null, // запланированная игра
      refereeId: judge4.id,
      clubId: clubs[2].id,
      refereeComments: 'Запланированная игра',
      createdAt: date4,
      updatedAt: date4,
    }
  }))
  
  // Игра 5 - В другом клубе
  const judge5 = judge1
  const players5 = getRandomPlayers(judge5)
  
  // Дата для пятой игры - недавняя прошлая игра
  const date5 = new Date('2025-04-15')
  games.push(await prisma.game.create({
    data: {
      name: 'Международная игра',
      gameType: 'classic',
      result: 'draw',
      refereeId: judge5.id,
      clubId: clubs[3].id,
      refereeComments: 'Международная игра',
      createdAt: date5,
      updatedAt: date5,
    }
  }))

  console.log(`Создано ${games.length} игр`)

  console.log('Заполнение базы данных завершено успешно!')
}

main()
  .catch((e) => {
    console.error('Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
