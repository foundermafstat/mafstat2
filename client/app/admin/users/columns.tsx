"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

// Определение интерфейса пользователя
export interface User {
  id: number
  name: string
  email: string
  role: string
  emailVerified: Date | string | null
  createdAt: Date
  updatedAt: Date
  bio?: string | null
  surname?: string | null
  nickname?: string | null
  country?: string | null
  clubId?: number | null
  birthday?: Date | null
  gender?: string | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  plan: string
  planUpdatedAt?: Date | null
  premiumNights: number
  club?: {
    id: number
    name: string
  } | null
}

// Функция для получения столбцов таблицы с действиями
export const getColumns = (
  onEditUser: (userId: number) => void,
  onDeleteUser: (userId: number) => void
): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Выбрать все"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Выбрать строку"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <div className="text-center">{row.getValue("id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Имя
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      const surname = row.original.surname
      
      return (
        <div className="font-medium">
          {name} {surname || ""}
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "role",
    header: "Роль",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      
      let badgeVariant: "default" | "secondary" | "destructive" = "secondary"
      let label = "Пользователь"
      
      if (role === "admin") {
        badgeVariant = "destructive"
        label = "Админ"
      } else if (role === "premium") {
        badgeVariant = "default"
        label = "Премиум"
      }
      
      return <Badge variant={badgeVariant}>{label}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "club",
    header: "Клуб",
    cell: ({ row }) => {
      const club = row.original.club
      return <div>{club?.name || "Нет клуба"}</div>
    },
  },
  {
    accessorKey: "isTournamentJudge",
    header: "Судья",
    cell: ({ row }) => {
      const isTournamentJudge = row.original.isTournamentJudge
      const isSideJudge = row.original.isSideJudge
      
      if (isTournamentJudge && isSideJudge) {
        return <Badge variant="outline">Турнирный + Боковой</Badge>
      } else if (isTournamentJudge) {
        return <Badge variant="outline">Турнирный</Badge>
      } else if (isSideJudge) {
        return <Badge variant="outline">Боковой</Badge>
      }
      
      return <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "emailVerified",
    header: "Верификация",
    cell: ({ row }) => {
      const verified = row.original.emailVerified
      return verified ? 
        <Badge variant="default">Подтвержден</Badge> : 
        <Badge variant="secondary">Не подтвержден</Badge>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Дата регистрации",
    cell: ({ row }) => {
      const date = row.original.createdAt
      return <div>{date ? format(new Date(date), "dd.MM.yyyy") : "-"}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Открыть меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Действия</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEditUser(user.id)}>
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDeleteUser(user.id)}
            >
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
