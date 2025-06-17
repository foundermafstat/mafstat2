"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Club } from "@/types/game"
import { useServerData } from "@/hooks/use-server-data"

interface ClubSelectProps {
  value: string
  onChange: (value: string) => void
}

export function ClubSelect({ value, onChange }: ClubSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { data, isLoading } = useServerData<Club[]>("clubs")

  const clubs = React.useMemo(() => data || [], [data])

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        Loading clubs...
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? value : "Select club..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search club..." />
          <CommandList>
            <CommandEmpty>No club found.</CommandEmpty>
            <CommandGroup>
              {clubs.map((club) => (
                <CommandItem
                  key={club.id}
                  value={club.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === club.name ? "opacity-100" : "opacity-0")} />
                  {club.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
