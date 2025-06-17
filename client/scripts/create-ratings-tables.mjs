import { rawQuery } from "../lib/db";

async function createRatingsTables() {
  // Создание таблицы рейтингов
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      owner_id INTEGER REFERENCES users(id),
      club_id INTEGER REFERENCES clubs(id),
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Создание таблицы для связи рейтингов и игр
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS rating_games (
      id SERIAL PRIMARY KEY,
      rating_id INTEGER REFERENCES ratings(id) ON DELETE CASCADE,
      game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
      added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(rating_id, game_id)
    );
  `);

  // Создание таблицы для результатов рейтинга по игрокам
  await rawQuery(`
    CREATE TABLE IF NOT EXISTS rating_results (
      id SERIAL PRIMARY KEY,
      rating_id INTEGER REFERENCES ratings(id) ON DELETE CASCADE,
      player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
      points NUMERIC(10, 2) DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      civilian_wins INTEGER DEFAULT 0,
      mafia_wins INTEGER DEFAULT 0,
      don_games INTEGER DEFAULT 0,
      sheriff_games INTEGER DEFAULT 0,
      first_outs INTEGER DEFAULT 0,
      best_move TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(rating_id, player_id)
    );
  `);

  console.log("Рейтинговые таблицы созданы успешно");
}

// Выполняем создание таблиц
createRatingsTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Ошибка при создании таблиц:", error);
    process.exit(1);
  });
