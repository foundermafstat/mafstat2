import { addPlayerFieldsToUsers } from "../lib/migrations/add-player-fields-to-users";

async function runMigration() {
  console.log("Запуск миграции для добавления полей игрока...");
  
  try {
    const result = await addPlayerFieldsToUsers();
    
    if (result.success) {
      console.log("Миграция успешно выполнена!");
    } else {
      console.error("Ошибка при выполнении миграции:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("Непредвиденная ошибка при выполнении миграции:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Запускаем миграцию
runMigration();
