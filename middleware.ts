import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Получение пути запроса
  const { pathname } = request.nextUrl

  // Публичные маршруты, доступные всем
  const publicRoutes = [
    "/login", 
    "/register", 
    "/", 
    "/api/auth",
    "/api/setup"
  ]

  // Проверка, является ли маршрут публичным или API маршрутом для аутентификации
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))
  const isAuthRoute = pathname.startsWith("/api/auth/")
  
  // Маршруты админа
  const isAdminRoute = pathname.startsWith("/admin")
  
  // Получаем сессионный токен напрямую из cookies
  const sessionToken = request.cookies.get("next-auth.session-token")?.value
  
  // Проверяем наличие сессии
  if (!sessionToken && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Если путь начинается с /admin, проверяем роль из JWT
  // Для Edge Runtime перенесем проверку роли администратора на страницу
  if (isAdminRoute) {
    // Без аутентификации перенаправляем на главную
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    
    // В Edge Runtime мы не можем расшифровать JWT токен
    // Пропускаем и перекладываем проверку на страницу admin
  }

  return NextResponse.next()
}

// Указываем, на каких маршрутах должен работать middleware
export const config = {
  matcher: [
    // Совпадение со всеми страницами, кроме статических ресурсов и файлов
    "/((?!_next/static|_next/image|favicon.ico).*)", 
  ],
}
