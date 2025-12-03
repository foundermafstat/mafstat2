import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getAllClubs } from "@/lib/api-client"
import { PlusCircle } from "lucide-react"
import { SearchForm } from "./components/search-form"

export default async function ClubsPage() {
  const clubs = await getAllClubs()
  
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Клубы</h1>
          <Link href="/clubs/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Новый клуб
            </Button>
          </Link>
        </div>

        {/* Поисковая форма с использованием клиентского компонента */}
        <SearchForm initialClubs={clubs} />
      </main>
    </div>
  )
}
