"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// Типы данных
interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
  bio?: string
  surname?: string
  nickname?: string
  country?: string
  clubId?: number | null
  birthday?: string | Date | null
  gender?: "male" | "female" | "other" | null
  isTournamentJudge?: boolean
  isSideJudge?: boolean
}

// Схема валидации для формы профиля
const profileFormSchema = z.object({
  // Базовые поля пользователя
  name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  email: z.string().email({ message: "Введите корректный email" }).optional().or(z.literal("")),
  bio: z.string().max(500, { message: "Биография не может быть длиннее 500 символов" }).optional(),
  avatarUrl: z.string().url({ message: "Введите корректный URL изображения" }).optional().or(z.literal("")),
  
  // Дополнительные поля игрока
  surname: z.string().min(2, { message: "Фамилия должна содержать минимум 2 символа" }).optional(),
  nickname: z.string().max(100, { message: "Никнейм не может быть длиннее 100 символов" }).optional(),
  country: z.string().max(100, { message: "Название страны не может быть длиннее 100 символов" }).optional(),
  clubId: z.number().optional().nullable(),
  birthday: z.date().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional(),
  isTournamentJudge: z.boolean().default(false),
  isSideJudge: z.boolean().default(false)
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  user: User | null
  refreshUserData?: () => void
}

type Club = {
  id: number;
  name: string;
};

export function ProfileForm({ user, refreshUserData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [clubs, setClubs] = useState<Club[]>([])

  // Получаем список клубов
  useEffect(() => {
    async function fetchClubs() {
      try {
        const response = await api.get('/clubs')
        setClubs(response.data || [])
      } catch (error) {
        console.error('Ошибка при загрузке списка клубов:', error)
      }
    }
    
    fetchClubs()
  }, [])

  // Инициализируем форму с текущими данными пользователя
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
      avatarUrl: user?.image || "",
      surname: user?.surname || "",
      nickname: user?.nickname || "",
      country: user?.country || "",
      clubId: user?.clubId || null,
      birthday: user?.birthday ? new Date(user.birthday) : null,
      gender: (user?.gender === "male" || user?.gender === "female" || user?.gender === "other") ? user.gender : undefined,
      isTournamentJudge: user?.isTournamentJudge || false,
      isSideJudge: user?.isSideJudge || false
    }
  })

  // Функция для обработки отправки формы
  async function onSubmit(data: ProfileFormValues) {
    if (!user) return;
    
    setIsLoading(true)
    
    try {
      // Преобразуем данные для отправки на сервер
      const formData = {
        ...data,
        // Преобразуем объект Date в строку ISO для правильной сериализации
        birthday: data.birthday ? data.birthday.toISOString() : null,
        // Используем поле avatarUrl как image
        image: data.avatarUrl
      }
      
      // Удаляем avatarUrl из отправляемых данных, так как на сервере поле image
      // @ts-ignore
      delete formData.avatarUrl
      
      // Отправляем PUT запрос на сервер
      // Вместо /api/profile используем RESTful endpoint пользователя
      await api.put(`/users/${user.id}`, formData)
      
      toast.success("Профиль успешно обновлен")
      
      // Принудительное обновление страницы для загрузки новых данных пользователя
      if (refreshUserData) {
        refreshUserData()
      } else {
        window.location.reload()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Произошла ошибка")
      console.error("Ошибка обновления профиля:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Генерируем инициалы для аватара
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "У"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Информация профиля</CardTitle>
        <CardDescription>Обновите свои личные данные и информацию игрока</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Основная информация</h3>
              
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={form.watch("avatarUrl") || ""} alt={form.watch("name")} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>URL аватара</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/avatar.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ссылка на изображение для вашего профиля
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваше имя" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фамилия</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваша фамилия" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Никнейм</FormLabel>
                    <FormControl>
                      <Input placeholder="Ваш игровой никнейм" {...field} />
                    </FormControl>
                    <FormDescription>
                      Как вас знают в игровом сообществе
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" type="email" {...field} />
                    </FormControl>
                    <FormDescription>
                      Этот email будет использоваться для входа в систему
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>О себе</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Расскажите немного о себе..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Максимум 500 символов
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-medium border-t pt-6">Информация о игроке</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Страна</FormLabel>
                      <FormControl>
                        <Input placeholder="Россия" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пол</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите пол" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Мужской</SelectItem>
                          <SelectItem value="female">Женский</SelectItem>
                          <SelectItem value="other">Другой</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Дата рождения</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ru })
                              ) : (
                                <span>Выберите дату</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clubId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клуб</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : Number.parseInt(value, 10))}
                        defaultValue={field.value ? field.value.toString() : "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите клуб" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Не выбрано</SelectItem>
                          {clubs.map((club) => (
                            <SelectItem key={club.id} value={club.id.toString()}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isTournamentJudge"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Судья турнира</FormLabel>
                        <FormDescription>
                          Отметьте, если вы судья турнира
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSideJudge"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Боковой судья</FormLabel>
                        <FormDescription>
                          Отметьте, если вы боковой судья
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CardFooter className="px-0 pt-6 flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Сохранение..." : "Сохранить изменения"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                Отмена
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
