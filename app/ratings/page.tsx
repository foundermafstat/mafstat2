"use client"

import { useData } from "@/hooks/use-data"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Award, Building2, Users, CalendarRange } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type Rating = {
  id: number
  name: string
  description?: string
  owner_id: number
  club_id?: number
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
  owner_name?: string
  club_name?: string
  game_count: number
  player_count: number
}

export default function RatingsPage() {
  // Получаем данные с использованием хука useData
  const { data: responseData, isLoading, error } = useData<{
    success: boolean;
    ratings: Rating[];
  }>("/api/ratings");

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-heading">Рейтинги</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !responseData) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading">Рейтинги</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-red-500 text-lg mb-4">
                {error?.message || "Ошибка загрузки данных"}
              </p>
              <Button onClick={() => window.location.reload()}>
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { ratings } = responseData;

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading">Рейтинги</h1>
        <Link href="/ratings/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Создать рейтинг
          </Button>
        </Link>
      </div>

      {ratings && ratings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map(rating => (
            <Link href={`/ratings/${rating.id}`} key={rating.id}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl mr-2">{rating.name}</CardTitle>
                    <Badge variant={rating.is_active ? "default" : "outline"}>
                      {rating.is_active ? "Активный" : "Завершен"}
                    </Badge>
                  </div>
                  {rating.club_name && (
                    <CardDescription className="flex items-center">
                      <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      {rating.club_name}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rating.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {rating.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center text-sm">
                        <Award className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{rating.player_count} игроков</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CalendarRange className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{rating.game_count} игр</span>
                      </div>
                    </div>
                    
                    {rating.start_date && (
                      <div className="text-xs text-muted-foreground">
                        {rating.end_date 
                          ? `${format(new Date(rating.start_date), 'dd.MM.yyyy')} - ${format(new Date(rating.end_date), 'dd.MM.yyyy')}`
                          : `Начало: ${format(new Date(rating.start_date), 'dd.MM.yyyy')}`}
                      </div>
                    )}
                    
                    <div className="pt-2 flex items-center text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      <span>Создан: {rating.owner_name || "Администратор"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <h2 className="text-xl font-semibold mb-2">Рейтингов пока нет</h2>
              <p className="text-muted-foreground mb-6">
                Создайте свой первый рейтинг, чтобы отслеживать результаты игроков
              </p>
              <Link href="/ratings/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Создать рейтинг
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
