import NextAuth from "next-auth"
import { authOptions } from "@/auth"

// Создание обработчиков для App Router
const handler = NextAuth(authOptions)

// Экспорт в формате, совместимом с App Router
export { handler as GET, handler as POST }
