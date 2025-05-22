"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Federation } from "@/types/game"
import { useServerData } from "@/hooks/use-server-data"

interface FederationSelectProps {
  value: string
  onChange: (value: string) => void
}

export function FederationSelect({ value, onChange }: FederationSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { data, isLoading } = useServerData<Federation[]>("federations")
  const [selectedFederation, setSelectedFederation] = React.useState<Federation | null>(null)

  const federations = React.useMemo(() => data || [], [data])

  React.useEffect(() => {
    if (federations.length > 0 && value) {
      const federation = federations.find((f) => f.id.toString() === value)
      setSelectedFederation(federation || null)
    } else {
      setSelectedFederation(null)
    }
  }, [federations, value])

  if (isLoading) {
    return (
      <Button variant="outline" className="w-full justify-between" disabled>
        Загрузка федераций...
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedFederation ? selectedFederation.name : "Выберите федерацию..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover">
        <Command>
          <CommandInput placeholder="Найти федерацию..." />
          <CommandList>
            <CommandEmpty>Федерация не найдена.</CommandEmpty>
            <CommandGroup>
              {federations.map((federation) => (
                <CommandItem
                  key={federation.id}
                  value={federation.id.toString()}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === federation.id.toString() ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {federation.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
