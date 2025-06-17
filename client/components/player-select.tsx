"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useServerData } from "@/hooks/use-server-data"
import { useState, useEffect, useMemo } from "react"

// Интерфейс для пользователя из таблицы users
interface User {
  id: number
  name: string
  surname: string
  nickname?: string
  email: string
  image?: string
  is_tournament_judge: boolean
  role: string
}

interface PlayerSelectProps {
  value: string
  onChange: (value: string) => void
  filterJudges?: boolean
  label?: string
  placeholder?: string
  slotNumber?: number // Добавляем параметр slotNumber
}

export function PlayerSelect({ 
  value, 
  onChange, 
  filterJudges = false,
  label = "Выберите игрока...",
  placeholder = "Поиск игрока...",
  slotNumber
}: PlayerSelectProps) {
  const [open, setOpen] = useState(false)
  // Используем users вместо players
  const { data, isLoading } = useServerData<User[]>("users")
  const [query, setQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const users = useMemo(() => data || [], [data])

  useEffect(() => {
    if (users.length > 0 && value) {
      // Проверка, является ли value строкой с именем и фамилией или числовым идентификатором
      if (!value.match(/^\d+$/)) {
        const user = users.find((u) => `${u.name} ${u.surname}` === value)
        setSelectedUser(user || null)
      } else {
        const user = users.find((u) => u.id.toString() === value)
        setSelectedUser(user || null)
      }
    } else {
      setSelectedUser(null)
    }
  }, [users, value])

  const filteredUsers = useMemo(() => {
    // Фильтр по судьям, если необходимо
    let result = filterJudges ? 
      users.filter((user) => user.is_tournament_judge) : 
      users;
    
    // Если есть поисковый запрос, фильтруем дополнительно по нему
    if (query?.trim()) {
      const searchText = query.toLowerCase().trim();
      
      console.log('Search query:', searchText);
      
      result = result.filter(user => {
        // Создаем строку для поиска, включая имя, фамилию и ник
        const fullName = `${user.name || ''} ${user.surname || ''} ${user.nickname || ''}`.toLowerCase();
        
        // Для более гибкого поиска используем includes вместо точного совпадения
        const isMatch = fullName.includes(searchText);
        if (isMatch) {
          console.log('Match found:', user.name, user.surname, user.nickname);
        }
        return isMatch;
      });
      
      console.log('Filtered users count:', result.length);
    }
    
    return result;
  }, [users, filterJudges, query])

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        Загрузка игроков...
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-expanded={open} className="w-full justify-between">
          {selectedUser ? `${selectedUser.name} ${selectedUser.surname}` : label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover">
        <Command shouldFilter={false}> {/* Отключаем встроенную фильтрацию, используем нашу */}
          <CommandInput 
            placeholder={placeholder} 
            value={query}
            onValueChange={(newValue) => {
              console.log('CommandInput value changed:', newValue);
              setQuery(newValue);
            }}
          />
          <CommandList>
            <CommandEmpty>Игрок не найден.</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.name} ${user.surname}`}
                  onSelect={() => {
                    console.log('Player selected:', user.id, user.name, user.surname, 'slotNumber:', slotNumber);
                    // Используем ID пользователя для значения
                    onChange(user.id.toString());
                    setSelectedUser(user);
                    setQuery(''); // Очищаем поисковый запрос после выбора
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      user.id.toString() === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {user.name} {user.surname}
                  {user.nickname && <span className="ml-2 text-muted-foreground">({user.nickname})</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
