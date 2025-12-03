"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Users, Database, Settings, CreditCard, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Панель администратора</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Пользователи</CardTitle>
            </div>
            <CardDescription>Управление учетными записями пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Доступные действия:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Просмотр списка пользователей</li>
              <li>Создание новых пользователей</li>
              <li>Редактирование существующих</li>
              <li>Управление ролями</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/users">Управление пользователями</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>База данных</CardTitle>
            </div>
            <CardDescription>Просмотр и управление данными</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Доступные действия:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Просмотр структуры таблиц</li>
              <li>Просмотр данных в таблицах</li>
              <li>Статистика базы данных</li>
              <li>Диагностика подключения</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/database">Управление базой данных</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Клубы</CardTitle>
            </div>
            <CardDescription>Управление клубами</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Доступные действия:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Просмотр списка клубов</li>
              <li>Создание новых клубов</li>
              <li>Редактирование существующих</li>
              <li>Управление федерациями клубов</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/clubs">Управление клубами</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Платежи</CardTitle>
            </div>
            <CardDescription>Управление платежами</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Доступные действия:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Просмотр всех транзакций</li>
              <li>Статус премиум-подписок</li>
              <li>Статистика по платежам</li>
              <li>Экспорт данных</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/payments">Управление платежами</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle>Настройки</CardTitle>
            </div>
            <CardDescription>Системные настройки</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Доступные действия:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Настройка прав доступа</li>
              <li>Управление конфигурацией</li>
              <li>Системные логи</li>
              <li>Резервное копирование</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/settings">Управление настройками</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
