"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type OptionType = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: OptionType[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Выберите элементы",
  searchPlaceholder = "Поиск...",
  emptyMessage = "Ничего не найдено",
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  // Получаем метки для выбранных значений
  const selectedLabels = React.useMemo(() => {
    return selected.map((value) => {
      const option = options.find((opt) => opt.value === value)
      return option ? option.label : value
    })
  }, [options, selected])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 max-w-[90%] overflow-hidden">
            {selected.length > 0 ? (
              selected.length > 2 ? (
                <Badge variant="secondary" className="rounded-sm">
                  {selected.length} выбрано
                </Badge>
              ) : (
                selectedLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="rounded-sm"
                  >
                    {label}
                  </Badge>
                ))
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    onChange(
                      isSelected
                        ? selected.filter((value) => value !== option.value)
                        : [...selected, option.value]
                    )
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </Command>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((label, i) => (
                <Badge
                  key={selected[i]}
                  variant="secondary"
                  className="rounded-sm px-1 py-0"
                >
                  {label}
                  <button
                    className="ml-1 rounded-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(selected[i])
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(selected[i])}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => onChange([])}
            >
              Очистить выбор
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
