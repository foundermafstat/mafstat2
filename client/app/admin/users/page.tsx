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
import { useSession } from "next-auth/react"

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
import { apiRequest, setAuthTokenFromSession } from "@/lib/api"
import { getAllClubs } from "@/lib/api-client"

// Тип для пользователя из Prisma
type User = {
  id: number
  name: string
  email: string
  role: string
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
  bio?: string | null
  surname?: string | null
  nickname?: string | null
  country?: string | null
  clubId?: number | null
  birthday?: Date | null
  gender?: string | null
  isTournamentJudge?: boolean
  isSideJudge?: boolean
  plan?: string
  planUpdatedAt?: Date | null
  premiumNights?: number
  club?: {
    id: number
    name: string
  } | null
}

type Club = {
  id: number
  name: string
}

type UserFormData = {
  name: string
  email: string
  role: string
  nickname: string | null
  surname: string | null
  country: string | null
  clubId: number | null
  isTournamentJudge: boolean
  isSideJudge: boolean
  premiumNights: number
}

export default function UsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const accessToken = session?.user?.accessToken as string | undefined
  const userRole = session?.user?.role as string | undefined
  const isLoadingSession = status === "loading"

  // Сохраняем токен в localStorage, если он есть в сессии
  // Если токена нет, но пользователь авторизован, пытаемся получить его через API
  useEffect(() => {
    const saveOrGetToken = async () => {
      if (session?.user?.accessToken) {
        setAuthTokenFromSession(session.user.accessToken as string)
        console.log('[UsersPage] Токен сохранен в localStorage из сессии')
      } else if (session?.user?.id && !accessToken) {
        // Если токена нет в сессии, но пользователь авторизован, 
        // пытаемся получить токен через API логин (если есть пароль) или через refresh
        console.log('[UsersPage] Токен отсутствует в сессии, но пользователь авторизован')
        // Пока просто логируем - в будущем можно добавить получение токена через API
      }
    }
    saveOrGetToken()
  }, [session, accessToken])

  const [users, setUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
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

  // Проверка авторизации и роли
  useEffect(() => {
    if (!isLoadingSession) {
      if (!session || !session.user) {
        router.push("/login")
      } else if (userRole !== 'admin') {
        router.push("/")
      }
    }
  }, [session, userRole, isLoadingSession, router])

  // Загрузка списка пользователей
  const fetchUsers = async () => {
    console.log('[UsersPage] fetchUsers вызван, accessToken из сессии:', !!accessToken)
    
    // Пытаемся получить токен из localStorage, если его нет в сессии
    let token = accessToken
    if (!token && typeof window !== 'undefined') {
      try {
        token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null
        console.log('[UsersPage] fetchUsers: токен из localStorage:', !!token)
      } catch (e) {
        console.error('[UsersPage] fetchUsers: ошибка при получении токена из localStorage:', e)
      }
    }
    
    if (!token) {
      console.error('[UsersPage] fetchUsers: токен не найден ни в сессии, ни в localStorage')
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует. Пожалуйста, войдите заново.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    
    console.log('[UsersPage] fetchUsers: начинаем загрузку с токеном')
    setLoading(true)
    try {
      const usersData = await apiRequest('/admin/users', { 
        method: 'GET',
        token: token
      })
      
      console.log('[UsersPage] fetchUsers: получены данные:', {
        isArray: Array.isArray(usersData),
        length: Array.isArray(usersData) ? usersData.length : 'не массив',
        data: usersData
      })
      
      if (Array.isArray(usersData)) {
        setAllUsers(usersData)
        setUsers(usersData)
        console.log('[UsersPage] fetchUsers: установлены пользователи, количество:', usersData.length)
      } else {
        console.error('[UsersPage] fetchUsers: ожидался массив, получено:', usersData)
        setAllUsers([])
        setUsers([])
      }
    } catch (error) {
      console.error('[UsersPage] fetchUsers: ошибка:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список пользователей",
        variant: "destructive",
      })
    } finally {
      console.log('[UsersPage] fetchUsers: завершено, устанавливаем loading = false')
      setLoading(false)
    }
  }

  // Загрузка списка клубов
  const fetchClubs = async () => {
    try {
      const clubsData = await getAllClubs()
      setClubs(clubsData.map((c: any) => ({ id: c.id, name: c.name })))
    } catch (error) {
      console.error('Ошибка загрузки клубов:', error)
    }
  }

  // Фильтрация пользователей
  const filterUsers = () => {
    console.log('[UsersPage] filterUsers вызван:', {
      allUsersIsArray: Array.isArray(allUsers),
      allUsersLength: allUsers.length,
      searchTerm,
      selectedClub
    })
    
    if (!Array.isArray(allUsers) || allUsers.length === 0) {
      console.log('[UsersPage] filterUsers: нет данных для фильтрации')
      setUsers([])
      return
    }

    let filtered = [...allUsers]

    // Фильтр по поиску (имя или никнейм)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        (user.nickname && user.nickname.toLowerCase().includes(searchLower)) ||
        (user.surname && user.surname.toLowerCase().includes(searchLower))
      )
    }

    // Фильтр по клубу
    if (selectedClub !== "all") {
      const clubId = parseInt(selectedClub)
      filtered = filtered.filter(user => user.clubId === clubId)
    }

    console.log('[UsersPage] filterUsers: отфильтровано пользователей:', filtered.length)
    setUsers(filtered)
  }

  // Загрузка данных при монтировании
  useEffect(() => {
    console.log('[UsersPage] useEffect для загрузки данных:', {
      isLoadingSession,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasToken: !!accessToken,
      accessTokenValue: accessToken ? accessToken.substring(0, 20) + '...' : 'нет',
      userRole,
      sessionUser: session?.user
    })
    
    if (!isLoadingSession && session && session.user) {
      // Пробуем загрузить данные даже если токена нет в сессии
      // Токен может быть в localStorage, apiRequest сам его получит
      console.log('[UsersPage] Загружаем данные...')
      fetchUsers()
      fetchClubs()
    } else {
      console.log('[UsersPage] Пропускаем загрузку данных:', {
        isLoadingSession,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!accessToken
      })
    }
  }, [isLoadingSession, session, accessToken]) // eslint-disable-line react-hooks/exhaustive-deps

  // Применение фильтров при изменении
  useEffect(() => {
    console.log('[UsersPage] Применение фильтров:', {
      searchTerm,
      selectedClub,
      allUsersCount: allUsers.length
    })
    filterUsers()
  }, [searchTerm, selectedClub, allUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  // Обработка изменения полей формы
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Обработка изменения чекбоксов
  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  // Открытие диалога редактирования пользователя
  const handleEditUser = async (userId: number) => {
    if (!accessToken) {
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const user = await apiRequest(`/admin/users/${userId}`, { 
        method: 'GET',
        token: accessToken 
      })
      
      if (!user) {
        throw new Error("Пользователь не найден")
      }

      setEditingUser(user)
      setFormData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        nickname: user.nickname || null,
        surname: user.surname || null,
        country: user.country || null,
        clubId: user.clubId || null,
        isTournamentJudge: user.isTournamentJudge || false,
        isSideJudge: user.isSideJudge || false,
        premiumNights: user.premiumNights || 0
      })
      setOpenDialog(true)
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Открытие диалога создания нового пользователя
  const handleCreateUser = () => {
    setEditingUser(null)
    setFormData({
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
    setOpenDialog(true)
  }

  // Сохранение пользователя
  const handleSaveUser = async () => {
    if (!accessToken) {
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingUser) {
        // Преобразуем данные формы в формат, ожидаемый сервером
        const requestData = {
          name: formData.name,
          surname: formData.surname,
          nickname: formData.nickname,
          email: formData.email,
          country: formData.country,
          club_id: formData.clubId, // Преобразуем clubId в club_id
          role: formData.role,
          is_tournament_judge: formData.isTournamentJudge, // Преобразуем в snake_case
          is_side_judge: formData.isSideJudge, // Преобразуем в snake_case
          premiumNights: formData.premiumNights
        }
        
        console.log('[UsersPage] Сохранение пользователя:', {
          userId: editingUser.id,
          formData,
          requestData
        })
        
        const response = await apiRequest(`/admin/users/${editingUser.id}`, {
          method: 'PUT',
          token: accessToken,
          body: JSON.stringify(requestData)
        })
        
        console.log('[UsersPage] Пользователь обновлен:', response)
        
        toast({
          title: "Успех",
          description: "Пользователь успешно обновлен",
        })
        
        setOpenDialog(false)
        fetchUsers()
      } else {
        // Создание нового пользователя
        // Преобразуем данные формы в формат, ожидаемый сервером
        const requestData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        }
        
        // Добавляем опциональные поля только если они заполнены
        if (formData.surname) requestData.surname = formData.surname
        if (formData.nickname) requestData.nickname = formData.nickname
        if (formData.country) requestData.country = formData.country
        if (formData.clubId) requestData.club_id = formData.clubId
        if (formData.isTournamentJudge) requestData.is_tournament_judge = formData.isTournamentJudge
        if (formData.isSideJudge) requestData.is_side_judge = formData.isSideJudge
        if (formData.premiumNights) requestData.premiumNights = formData.premiumNights
        
        console.log('[UsersPage] Создание пользователя:', {
          formData,
          requestData
        })
        
        const response = await apiRequest('/admin/users', {
          method: 'POST',
          token: accessToken,
          body: JSON.stringify(requestData)
        })
        
        console.log('[UsersPage] Пользователь создан:', response)
        
        toast({
          title: "Успех",
          description: "Пользователь успешно создан",
        })
        
        setOpenDialog(false)
        fetchUsers()
      }
    } catch (error) {
      console.error('[UsersPage] Ошибка при сохранении пользователя:', error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive",
      })
    }
  }

  // Удаление пользователя
  const handleDeleteUser = async () => {
    if (!deleteUserId) return

    if (!accessToken) {
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует",
        variant: "destructive",
      })
      return
    }

    try {
      await apiRequest(`/admin/users/${deleteUserId}`, {
        method: 'DELETE',
        token: accessToken
      })
      
      toast({
        title: "Успех",
        description: "Пользователь успешно удален",
      })
      
      setOpenDeleteDialog(false)
      setDeleteUserId(null)
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

  // Показываем загрузку, если сессия еще загружается
  if (isLoadingSession) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Показываем загрузку, если пользователь не авторизован или не админ
  if (!session || !session.user || userRole !== 'admin') {
    return (
      <div className="container py-6">
        <div className="text-center py-8">
          <p>Проверка доступа...</p>
        </div>
      </div>
    )
  }

  console.log('[UsersPage] Рендерим контент:', {
    loading,
    usersCount: users.length,
    allUsersCount: allUsers.length,
    clubsCount: clubs.length
  })

  return (
    <div className="container py-8 min-h-screen bg-background">
      <Toaster />
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
                {users.length === 0 ? (
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
                      <TableCell>{user.club?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.emailVerified ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Подтвержден
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              <XCircle className="w-3 h-3 mr-1" />
                              Не подтвержден
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setDeleteUserId(user.id)
                                setOpenDeleteDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

      {/* Диалог создания/редактирования пользователя */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Редактировать пользователя" : "Создать нового пользователя"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Внесите изменения в данные пользователя"
                : "Заполните форму для создания нового пользователя"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Имя *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Имя"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Фамилия</Label>
                <Input
                  id="surname"
                  name="surname"
                  value={formData.surname || ""}
                  onChange={handleFormChange}
                  placeholder="Фамилия"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Никнейм</Label>
              <Input
                id="nickname"
                name="nickname"
                value={formData.nickname || ""}
                onChange={handleFormChange}
                placeholder="Никнейм"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Роль *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Пользователь</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="premium">Премиум</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="club">Клуб</Label>
                <Select 
                  value={formData.clubId?.toString() || "none"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, clubId: value === "none" ? null : parseInt(value) }))}
                >
                  <SelectTrigger id="club">
                    <SelectValue placeholder="Выберите клуб" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет клуба</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Страна</Label>
              <Input
                id="country"
                name="country"
                value={formData.country || ""}
                onChange={handleFormChange}
                placeholder="Страна"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTournamentJudge"
                  checked={formData.isTournamentJudge}
                  onCheckedChange={(checked) => handleCheckboxChange('isTournamentJudge', checked as boolean)}
                />
                <Label htmlFor="isTournamentJudge">Турнирный судья</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSideJudge"
                  checked={formData.isSideJudge}
                  onCheckedChange={(checked) => handleCheckboxChange('isSideJudge', checked as boolean)}
                />
                <Label htmlFor="isSideJudge">Боковой судья</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="premiumNights">Премиум ночи</Label>
              <Input
                id="premiumNights"
                name="premiumNights"
                type="number"
                value={formData.premiumNights}
                onChange={(e) => setFormData(prev => ({ ...prev, premiumNights: parseInt(e.target.value) || 0 }))}
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveUser} disabled={!formData.name || !formData.email}>
              {editingUser ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
