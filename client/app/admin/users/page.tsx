"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw,
  UserRoundCog,
  ShieldAlert,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Crown,
  Search,
  Filter
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Checkbox } from "@/components/ui/checkbox"

// Импортируем серверные экшены
import { getAllUsers, getUserById, updateUser, deleteUser } from "@/actions/admin"
import { getAllClubs } from "@/actions/clubs"

// Тип для пользователя из Prisma
type User = {
  id: number
  name: string
  email: string
  role: string
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  // Дополнительные поля игрока
  bio?: string | null
  surname?: string | null
  nickname?: string | null
  country?: string | null
  clubId?: number | null
  birthday?: Date | null
  gender?: string | null
  isTournamentJudge?: boolean
  isSideJudge?: boolean
  // Премиум-статус
  plan?: string
  planUpdatedAt?: Date | null
  premiumNights?: number
  club?: {
    id: number
    name: string
  } | null
}

// Тип для клуба
type Club = {
  id: number
  name: string
  description: string | null
  url: string | null
  country: string | null
  city: string | null
  federation_id: number | null
  federation_name: string | null
  player_count: number
  game_count: number
  created_at: Date
  updated_at: Date
}

// Тип для формы редактирования пользователя
type UserFormData = {
  role: "user" | "admin" | "premium"
  name: string
  email: string
  nickname: string | null
  surname: string | null
  country: string | null
  clubId: number | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  premiumNights: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClub, setSelectedClub] = useState<string>("all")
  
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    role: "user",
    nickname: null,
    surname: null,
    country: null,
    clubId: null,
    isTournamentJudge: false,
    isSideJudge: false,
    premiumNights: 0
  })
  
  const router = useRouter()

  // Загрузка списка пользователей с использованием Prisma
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const result = await getAllUsers()
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      const usersData = result.users || []
      setAllUsers(usersData)
      setUsers(usersData)
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Загрузка списка клубов
  const fetchClubs = async () => {
    try {
      const result = await getAllClubs()
      setClubs(result.data || [])
    } catch (error) {
      console.error('Ошибка загрузки клубов:', error)
    }
  }

  // Фильтрация пользователей
  const filterUsers = () => {
    let filtered = allUsers

    // Фильтр по поиску (имя или никнейм)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        (user.nickname && user.nickname.toLowerCase().includes(searchLower)) ||
        (user.surname && user.surname.toLowerCase().includes(searchLower))
      )
    }

    // Фильтр по клубу
    if (selectedClub !== "all") {
      const clubId = parseInt(selectedClub)
      filtered = filtered.filter(user => user.clubId === clubId)
    }

    setUsers(filtered)
  }

  // Применение фильтров при изменении
  useEffect(() => {
    filterUsers()
  }, [searchTerm, selectedClub, allUsers])

  useEffect(() => {
    fetchUsers()
    fetchClubs()
  }, [])

  // Обработка изменения полей формы
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Обработка изменения чекбоксов
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  // Обработка изменения роли
  const handleRoleChange = (value: "user" | "admin" | "premium") => {
    setFormData(prev => ({ ...prev, role: value }))
  }

  // Открытие диалога редактирования пользователя
  const handleEditUser = async (userId: number) => {
    try {
      setLoading(true)
      const result = await getUserById(userId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      const user = result.user
      
      if (!user) {
        throw new Error("Пользователь не найден")
      }
      
      setEditingUser(user as User)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role as "user" | "admin" | "premium",
        nickname: user.nickname,
        surname: user.surname,
        country: user.country,
        clubId: user.clubId,
        isTournamentJudge: user.isTournamentJudge || false,
        isSideJudge: user.isSideJudge || false,
        premiumNights: user.premiumNights || 0
      })
      setOpenDialog(true)
    } catch (error) {
      console.error('Ошибка при загрузке пользователя:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные пользователя",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Открытие диалога удаления пользователя
  const handleDeleteClick = (userId: number) => {
    setDeleteUserId(userId)
    setOpenDeleteDialog(true)
  }

  // Сохранение пользователя через Prisma
  const handleSaveUser = async () => {
    if (!editingUser) return
    
    try {
      // Базовая валидация
      if (!formData.name || !formData.email) {
        toast({
          title: "Ошибка",
          description: "Имя и Email обязательны для заполнения",
          variant: "destructive",
        })
        return
      }

      const result = await updateUser(editingUser.id, formData)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Успех",
        description: "Пользователь успешно обновлен",
      })
      
      // Закрытие диалога и обновление списка пользователей
      setOpenDialog(false)
      fetchUsers()
      
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      })
    }
  }

  // Удаление пользователя через Prisma
  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    try {
      const result = await deleteUser(deleteUserId)
      
      if (result.error) {
        throw new Error(result.error)
      }
      
      toast({
        title: "Успех",
        description: "Пользователь успешно удален",
      })
      
      setOpenDeleteDialog(false)
      fetchUsers()
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <Card className="w-full mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Управление пользователями</CardTitle>
            <CardDescription>
              Просмотр и редактирование пользователей системы
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchUsers}
            disabled={loading}
            title="Обновить список"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени, фамилии или никнейму..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Все клубы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все клубы</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id.toString()}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Клуб</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      {searchTerm || selectedClub !== "all" ? "Пользователи не найдены по заданным критериям" : "Пользователи не найдены"}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>
                        {user.name} {user.surname && `${user.surname}`}
                        {user.nickname && <span className="text-gray-400 ml-1">({user.nickname})</span>}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="destructive" className="flex items-center gap-1 font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg">
                            <ShieldAlert className="w-3 h-3" />
                            Админ
                          </Badge>
                        ) : user.role === 'premium' ? (
                          <Badge variant="default" className="flex items-center gap-1 font-medium bg-amber-500">
                            <Crown className="w-3 h-3" />
                            Премиум
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 font-medium">
                            <UserRoundCog className="w-3 h-3" />
                            Пользователь
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.club ? user.club.name : '-'}
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge variant="outline" className="flex items-center gap-1 font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle className="w-3 h-3" />
                            Подтвержден
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <XCircle className="w-3 h-3" />
                            Не подтвержден
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Меню</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleEditUser(user.id)}
                              className="flex items-center gap-2"
                            >
                              <Pencil className="w-4 h-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(user.id)}
                              className="flex items-center gap-2 text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог редактирования пользователя */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Редактирование пользователя
            </DialogTitle>
            <DialogDescription>
              Измените информацию о пользователе
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Имя
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="surname" className="text-right">
                Фамилия
              </Label>
              <Input
                id="surname"
                name="surname"
                value={formData.surname || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nickname" className="text-right">
                Никнейм
              </Label>
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Страна
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country || ''}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Роль
              </Label>
              <Select 
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="premium">Премиум</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'premium' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="premiumNights" className="text-right">
                  Премиум ночи
                </Label>
                <Input
                  id="premiumNights"
                  name="premiumNights"
                  type="number"
                  min="0"
                  value={formData.premiumNights || 0}
                  onChange={handleFormChange}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Опции судьи
              </Label>
              <div className="col-span-3 flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isTournamentJudge" 
                    checked={formData.isTournamentJudge}
                    onCheckedChange={(checked) => handleCheckboxChange('isTournamentJudge', checked === true)}
                  />
                  <Label htmlFor="isTournamentJudge">Турнирный судья</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isSideJudge" 
                    checked={formData.isSideJudge}
                    onCheckedChange={(checked) => handleCheckboxChange('isSideJudge', checked === true)}
                  />
                  <Label htmlFor="isSideJudge">Боковой судья</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Отмена</Button>
            <Button onClick={handleSaveUser}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этого пользователя? Это действие невозможно отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Отмена</Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  )
}
