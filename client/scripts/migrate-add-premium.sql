-- Добавление колонки premium_nights в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_nights INTEGER DEFAULT 0;

-- Обновление индекса, если нужно
COMMENT ON COLUMN users.premium_nights IS 'Количество оставшихся игровых вечеров для премиум-пользователя';

-- Проверка и обновление типов ролей (добавление premium)
DO $$
BEGIN
    -- Проверяем, существует ли ограничение для роли
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
        -- Удаляем существующее ограничение
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    -- Добавляем новое ограничение с премиум-ролью
    ALTER TABLE users ADD CONSTRAINT users_role_check 
        CHECK (role IN ('user', 'admin', 'premium'));
END $$;
