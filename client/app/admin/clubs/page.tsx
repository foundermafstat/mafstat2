"use client"

import { useState, useEffect } from "react"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw,
  Building2,
  Search,
  Users,
  Globe
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useSession } from "next-auth/react"
import { MultiSelect } from "@/components/ui/multi-select"
import { apiRequest } from "@/lib/api"

// Импортируем API клиент
import { 
  getAllFederations
} from "@/lib/api-client"

type Club = {
  id: number
  name: string
  description: string | null
  url: string | null
  country: string | null
  city: string | null
  federation_ids?: number[]
  federation_names?: string[]
  player_count?: number
  game_count?: number
  created_at: string
  updated_at: string
}

type ClubFormData = {
  name: string
  description: string
  url: string
  country: string
  city: string
  federation_ids: number[]
}

export default function ClubsPage() {
  const { data: session } = useSession()
  const accessToken = session?.user?.accessToken as string | undefined

  const [clubs, setClubs] = useState<Club[]>([])
  const [allClubs, setAllClubs] = useState<Club[]>([])
  const [federations, setFederations] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [deleteClubId, setDeleteClubId] = useState<number | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  
  // Фильтры
  const [searchTerm, setSearchTerm] = useState("")
  
  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
    url: "",
    country: "",
    city: "",
    federation_ids: []
  })
  
  const router = useRouter()

  // Загрузка списка клубов
  const fetchClubs = async () => {
    setLoading(true)
    try {
      const clubsData = await apiRequest('/clubs', { 
        method: 'GET',
        token: accessToken 
      })
      setAllClubs(clubsData)
      setClubs(clubsData)
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список клубов",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Загрузка списка федераций
  const fetchFederations = async () => {
    try {
      const federationsData = await getAllFederations()
      setFederations(federationsData.map((f: any) => ({ id: f.id, name: f.name })))
    } catch (error) {
      console.error('Ошибка загрузки федераций:', error)
    }
  }

  // Фильтрация клубов
  const filterClubs = () => {
    let filtered = [...allClubs]

    if (searchTerm) {
      filtered = filtered.filter(club =>
        club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        club.country?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setClubs(filtered)
  }

  useEffect(() => {
    fetchClubs()
    fetchFederations()
  }, [])

  useEffect(() => {
    filterClubs()
  }, [searchTerm, allClubs])

  // Открытие диалога редактирования клуба
  const handleEditClub = (club: Club) => {
    setEditingClub(club)
    setFormData({
      name: club.name || "",
      description: club.description || "",
      url: club.url || "",
      country: club.country || "",
      city: club.city || "",
      federation_ids: club.federation_ids || []
    })
    setOpenDialog(true)
  }

  // Открытие диалога создания нового клуба
  const handleCreateClub = () => {
    setEditingClub(null)
    setFormData({
      name: "",
      description: "",
      url: "",
      country: "",
      city: "",
      federation_ids: []
    })
    setOpenDialog(true)
  }

  // Сохранение клуба
  const handleSaveClub = async () => {
    if (!accessToken) {
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingClub) {
        // Преобразуем данные формы в формат, ожидаемый сервером
        const requestData = {
          name: formData.name,
          description: formData.description || null,
          url: formData.url || null,
          country: formData.country || null,
          city: formData.city || null,
          federation_ids: formData.federation_ids || []
        }
        
        console.log('[ClubsPage] Обновление клуба:', {
          clubId: editingClub.id,
          formData,
          requestData
        })
        
        const response = await apiRequest(`/clubs/${editingClub.id}`, {
          method: 'PUT',
          token: accessToken,
          body: JSON.stringify(requestData)
        })
        
        console.log('[ClubsPage] Клуб обновлен:', response)
        
        toast({
          title: "Успех",
          description: "Клуб успешно обновлен",
        })
      } else {
        // Преобразуем данные формы в формат, ожидаемый сервером
        const requestData = {
          name: formData.name,
          description: formData.description || null,
          url: formData.url || null,
          country: formData.country || null,
          city: formData.city || null,
          federation_ids: formData.federation_ids || []
        }
        
        console.log('[ClubsPage] Создание клуба:', {
          formData,
          requestData
        })
        
        const response = await apiRequest('/clubs', {
          method: 'POST',
          token: accessToken,
          body: JSON.stringify(requestData)
        })
        
        console.log('[ClubsPage] Клуб создан:', response)
        
        toast({
          title: "Успех",
          description: "Клуб успешно создан",
        })
      }
      setOpenDialog(false)
      fetchClubs()
    } catch (error: any) {
      console.error('[ClubsPage] Ошибка при сохранении клуба:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить клуб",
        variant: "destructive",
      })
    }
  }

  // Удаление клуба
  const handleDeleteClub = async () => {
    if (!deleteClubId) return

    if (!accessToken) {
      toast({
        title: "Ошибка",
        description: "Не авторизован - токен отсутствует",
        variant: "destructive",
      })
      return
    }

    try {
      await apiRequest(`/clubs/${deleteClubId}`, {
        method: 'DELETE',
        token: accessToken
      })
      toast({
        title: "Успех",
        description: "Клуб успешно удален",
      })
      setOpenDeleteDialog(false)
      setDeleteClubId(null)
      fetchClubs()
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить клуб",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <Toaster />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Управление клубами</h1>
          <p className="text-muted-foreground mt-1">
            Создание, редактирование и удаление клубов
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchClubs}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
          <Button onClick={handleCreateClub}>
            <Plus className="mr-2 h-4 w-4" />
            Создать клуб
          </Button>
        </div>
      </div>

      {/* Поиск */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, городу или стране..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Таблица клубов */}
      <Card>
        <CardHeader>
          <CardTitle>Список клубов</CardTitle>
          <CardDescription>
            Всего клубов: {clubs.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Страна</TableHead>
                  <TableHead>Федерации</TableHead>
                  <TableHead>Игроки</TableHead>
                  <TableHead>Игры</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Клубы не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  clubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>{club.city || "-"}</TableCell>
                      <TableCell>{club.country || "-"}</TableCell>
                      <TableCell>
                        {club.federation_names && club.federation_names.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {club.federation_names.map((name, idx) => (
                              <Badge key={idx} variant="secondary">{name}</Badge>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {club.player_count || 0}
                        </div>
                      </TableCell>
                      <TableCell>{club.game_count || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClub(club)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteClubId(club.id)
                              setOpenDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Диалог создания/редактирования клуба */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClub ? "Редактировать клуб" : "Создать новый клуб"}
            </DialogTitle>
            <DialogDescription>
              {editingClub
                ? "Внесите изменения в данные клуба"
                : "Заполните форму для создания нового клуба"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название клуба"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание клуба"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Страна</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Страна"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Город</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Город"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="federations">Федерации</Label>
              <MultiSelect
                options={federations.map((f) => ({
                  value: f.id.toString(),
                  label: f.name,
                }))}
                selected={formData.federation_ids.map((id) => id.toString())}
                onChange={(selected) =>
                  setFormData({
                    ...formData,
                    federation_ids: selected.map((id) => parseInt(id)),
                  })
                }
                placeholder="Выберите федерации"
                searchPlaceholder="Поиск федераций..."
                emptyMessage="Федерации не найдены"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveClub} disabled={!formData.name}>
              {editingClub ? "Сохранить" : "Создать"}
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
              Вы уверены, что хотите удалить этот клуб? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteClub}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

