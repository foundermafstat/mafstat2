"use client"

import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Club } from "@/types"

interface ClubFilterProps {
  clubs: Club[]
  selectedClubId: number | null
  onSelect: (clubId: number | null) => void
  className?: string
}

export function ClubFilter({
  clubs,
  selectedClubId,
  onSelect,
  className,
}: ClubFilterProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter clubs based on search term
  const filteredClubs = useMemo(() => {
    if (!searchTerm) return clubs
    
    const term = searchTerm.toLowerCase()
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(term) ||
        (club.city?.toLowerCase().includes(term) ?? false) ||
        (club.country?.toLowerCase().includes(term) ?? false)
    )
  }, [clubs, searchTerm])

  // Find selected club
  const selectedClub = useMemo(
    () => clubs.find((club) => club.id.toString() === selectedClubId?.toString()) || null,
    [clubs, selectedClubId]
  )

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(null)
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    params.delete('clubId')
    router.push(`/players?${params.toString()}`)
  }

  const handleSelect = (clubId: number | null) => {
    onSelect(clubId)
    setOpen(false)
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    if (clubId) {
      params.set('clubId', clubId.toString())
    } else {
      params.delete('clubId')
    }
    router.push(`/players?${params.toString()}`)
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedClub ? (
              <div className="flex items-center">
                <span className="font-medium">{selectedClub.name}</span>
                {selectedClub.city && (
                  <span className="ml-2 text-muted-foreground">
                    ({selectedClub.city})
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-6 w-6 p-0 hover:bg-transparent hover:text-destructive"
                  onClick={clearFilter}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground">Выберите клуб...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Поиск клуба..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>Клуб не найден</CommandEmpty>
            <CommandGroup>
              <CommandList>
                <ScrollArea className="h-[200px] overflow-y-auto">
                  <CommandItem
                    onSelect={() => handleSelect(null)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedClubId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Все клубы
                  </CommandItem>
                  {filteredClubs.map((club) => (
                    <CommandItem
                      key={club.id}
                      onSelect={() => handleSelect(club.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClubId === club.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{club.name}</span>
                        {(club.city || club.country) && (
                          <span className="text-xs text-muted-foreground">
                            {[club.city, club.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
