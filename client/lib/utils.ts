import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует дату ISO строки в читаемый формат
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  
  try {
    const date = new Date(dateString);
    
    // Проверка валидности даты
    if (Number.isNaN(date.getTime())) return "Некорректная дата";
    
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch (error) {
    console.error("Ошибка форматирования даты:", error);
    return "Ошибка даты";
  }
}
