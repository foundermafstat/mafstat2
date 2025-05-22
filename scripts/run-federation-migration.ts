import { addSampleFederations } from "../lib/migrations/add-sample-federations"

// Функция для запуска миграции
async function runMigration() {
  console.log("Запуск скрипта миграции федераций...")
  
  try {
    const result = await addSampleFederations()
    
    if (result.success) {
      console.log("✅ Миграция федераций выполнена успешно")
      process.exit(0)
    } else {
      console.error("❌ Ошибка при выполнении миграции федераций:", result.message)
      console.error(result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Неожиданная ошибка при запуске миграции:", error)
    process.exit(1)
  }
}

// Запускаем миграцию
runMigration()
