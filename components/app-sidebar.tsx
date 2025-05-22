"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import { 
  Home,
  Users,
  Building2, 
  Globe, 
  GamepadIcon, 
  Settings, 
  Database, 
  LayoutDashboard,
  Menu as MenuIcon,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Code,
  Trophy
} from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/components/language-switcher"

interface AppSidebarProps {
  children: React.ReactNode
}

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Используем state для иконки темы, чтобы избежать проблем с гидратацией
  const [mounted, setMounted] = useState(false)
  
  // Получаем функцию перевода для навигации
  const t = useTranslations('navigation')

  // Обработчик выхода из системы
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" })
  }

  // Определяем, является ли пользователь администратором
  const isAdmin = session?.user?.role === 'admin'

  // Монтирование компонента
  useEffect(() => {
    setMounted(true)
  }, [])

  // Обработчики изменения размера экрана для адаптивности
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileNow = window.innerWidth < 768;
      setIsMobile(isMobileNow);
      // Только изменяем состояние сайдбара при изменении размера экрана
      if (isMobileNow !== isMobile) {
        setSidebarOpen(!isMobileNow);
      }
    }
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    }
  }, [isMobile]);

  // Добавляем класс к body для фиксации прокрутки при открытом мобильном меню
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.classList.add("sidebar-open");
      // Добавляем класс "open" к элементу сайдбара
      const sidebarElement = document.querySelector(".sidebar");
      if (sidebarElement) {
        sidebarElement.classList.add("open");
      }
    } else {
      document.body.classList.remove("sidebar-open");
      // Удаляем класс "open" из элемента сайдбара
      const sidebarElement = document.querySelector(".sidebar");
      if (sidebarElement) {
        sidebarElement.classList.remove("open");
      }
    }
    
    return () => {
      document.body.classList.remove("sidebar-open");
      const sidebarElement = document.querySelector(".sidebar");
      if (sidebarElement) {
        sidebarElement.classList.remove("open");
      }
    };
  }, [isMobile, sidebarOpen]);

  // Маршруты основного меню
  const mainRoutes = [
    {
      href: "/",
      label: t('dashboard'),
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/games",
      label: t('games'),
      icon: GamepadIcon,
      active: pathname === "/games" || pathname.startsWith("/games/"),
    },
    {
      href: "/ratings",
      label: "Рейтинги", // Используем русское название для сохранения единообразия в UI
      icon: Trophy,
      active: pathname === "/ratings" || pathname.startsWith("/ratings/"),
    },
    {
      href: "/clubs",
      label: t('clubs'),
      icon: Building2,
      active: pathname === "/clubs" || pathname.startsWith("/clubs/"),
    },
    {
      href: "/federations",
      label: t('federations'),
      icon: Globe,
      active: pathname === "/federations" || pathname.startsWith("/federations/"),
    },
    {
      href: "/players",
      label: t('players'),
      icon: Users,
      active: pathname === "/players" || pathname.startsWith("/players/"),
    },
  ]

  // Маршруты админ-панели
  const adminRoutes = [
    {
      href: "/admin",
      label: t('admin'),
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      href: "/admin/users",
      label: t('adminUsers'),
      icon: Users,
      active: pathname === "/admin/users" || pathname.startsWith("/admin/users/"),
    },
    {
      href: "/admin/database",
      label: t('adminDatabase'),
      icon: Database,
      active: pathname === "/admin/database" || pathname.startsWith("/admin/database/"),
    },
    {
      href: "/admin/sql",
      label: "SQL запросы",
      icon: Code,
      active: pathname === "/admin/sql" || pathname.startsWith("/admin/sql/"),
    },
    {
      href: "/admin/settings",
      label: t('adminSettings'),
      icon: Settings,
      active: pathname === "/admin/settings" || pathname.startsWith("/admin/settings/"),
    },
  ]

  // Получаем инициалы пользователя для аватара
  const getUserInitials = () => {
    if (!session?.user?.name) return "U"
    return session.user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Функция для переключения сайдбара
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Затемнение фона при открытом мобильном меню */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Кнопка-гамбургер для мобильных устройств */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="sidebar-trigger fixed top-4 left-4 z-50 shadow-sm border border-border bg-background md:hidden"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X className="h-5 w-5 text-primary" /> : <MenuIcon className="h-5 w-5" />}
      </Button>
      
      {/* Сайдбар */}
      <aside 
        className={cn(
          "sidebar bg-sidebar-background border-r border-sidebar-border sidebar-wrapper",
          "flex flex-col h-full",
          isMobile ? "fixed inset-y-0 left-0 z-40" : "relative",
          isMobile && sidebarOpen ? "translate-x-0" : isMobile ? "-translate-x-full" : "",
          "transition-transform duration-300 ease-in-out"
        )}
        style={{ width: '280px' }}
      >
        <div className="flex flex-col h-full p-4 gap-4">
          {/* Шапка сайдбара */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-xl font-bold text-primary">MAFSTAT</Link>
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          
          {/* Основное меню */}
          <nav className="space-y-1.5">
            {mainRoutes.map((route) => (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2 font-normal",
                    route.active 
                      ? "bg-sidebar-accent text-primary" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
                  )}
                >
                  <route.icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Button>
              </Link>
            ))}
          </nav>
          
          {/* Админ-секция */}
          {isAdmin && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-2">
                {t('administration')}
              </div>
              <nav className="space-y-1.5">
                {adminRoutes.map((route) => (
                  <Link key={route.href} href={route.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-2 font-normal",
                        route.active 
                          ? "bg-sidebar-accent text-primary" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-primary"
                      )}
                    >
                      <route.icon className="h-4 w-4" />
                      <span>{route.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          )}
          
          {/* Футер сайдбара */}
          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Переключатель темы */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="w-full h-10 flex justify-center">
                    {mounted && (
                      theme === "dark" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    {t('theme.light')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    {t('theme.dark')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    {t('theme.system')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Переключатель языка */}
              <div className="flex justify-center">
                <LanguageSwitcher />
              </div>
            </div>
            
            {/* Профиль пользователя */}
            {session ? (
							<Link href="/profile" className="flex items-center">
								<div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent ">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs cursor-pointer">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden cursor-pointer">
                  <span className="text-sm font-medium truncate">{session.user?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {session.user?.role === "admin" ? t('administrator') : t('user')}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('profile')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSignOut();
                        }
                      }}
                      className="flex items-center"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
							</Link>
              
            ) : (
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/login" className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>{t('login')}</span>
                  </Link>
                </Button>
                <Button size="sm" className="w-full justify-start bg-primary hover:bg-primary/90" asChild>
                  <Link href="/register" className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>{t('register')}</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Основной контент */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden relative max-w-full",
        "transition-all duration-300 ease-in-out",
      )}>
        {/* Верхняя панель */}
        <div className="sticky top-0 z-10 flex items-center justify-end border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Переключатель языка в топбаре только для мобильных устройств */}
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
            
            {/* Переключатель темы в топбаре только для мобильных устройств */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  {mounted && (
                    theme === "dark" ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  {t('theme.light')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  {t('theme.dark')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  {t('theme.system')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Контент страницы */}
        <div className="flex-1 overflow-auto p-4 md:p-6 admin-content">
          {children}
        </div>
      </main>
    </div>
  )
}
