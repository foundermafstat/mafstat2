"use client"

import * as React from "react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { FormControl } from "@/components/ui/form"
import type { DateRange } from "react-day-picker"

interface DatePickerProps {
  // Новые свойства
  date?: Date
  setDate?: (date: Date | undefined) => void
  // Существующие свойства
  value?: Date | null
  onChange?: (date: Date | null) => void
  placeholder?: string
  fromDate?: Date
  className?: string
  disabled?: boolean
}

export function DatePicker({
  // Поддерживаем оба варианта свойств
  date,
  setDate,
  value,
  onChange,
  placeholder,
  fromDate,
  className,
  disabled
}: DatePickerProps) {
  // Определяем текущую дату и функцию установки даты
  const currentDate = date || value || null
  const handleDateChange = (newDate: Date | undefined) => {
    if (setDate) setDate(newDate)
    if (onChange) onChange(newDate || null)
  }
  // Проверяем, находимся ли внутри FormProvider
  const [isFormContext, setIsFormContext] = React.useState(false)

  React.useEffect(() => {
    try {
      // Эта проверка не вызовет ошибку, так как не использует хук напрямую
      const hasFormContext = typeof window !== "undefined" && !!document.querySelector("[data-form-root]")
      setIsFormContext(hasFormContext)
    } catch (e) {
      setIsFormContext(false)
    }
  }, [])
  
  // Создаем кнопку выбора даты
  const dateButton = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !currentDate && "text-muted-foreground",
        className
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {currentDate 
        ? format(currentDate, "PPP", { locale: ru }) 
        : placeholder || "Выберите дату"}
    </Button>
  )

  return (
    <Popover>
      <PopoverTrigger asChild>
        {isFormContext ? <FormControl>{dateButton}</FormControl> : dateButton}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={currentDate || undefined}
          onSelect={handleDateChange}
          initialFocus
          locale={ru}
          fromDate={fromDate}
        />
      </PopoverContent>
    </Popover>
  )
}

interface RangeDatePickerProps {
  from?: Date
  to?: Date
  setDateRange: (range: DateRange | undefined) => void
  className?: string
  disabled?: boolean
}

export function RangeDatePicker({
  from,
  to,
  setDateRange,
  className,
  disabled
}: RangeDatePickerProps) {
  // Проверяем, находимся ли внутри FormProvider
  const [isFormContext, setIsFormContext] = React.useState(false)

  React.useEffect(() => {
    try {
      // Эта проверка не вызовет ошибку, так как не использует хук напрямую
      const hasFormContext = typeof window !== "undefined" && !!document.querySelector("[data-form-root]")
      setIsFormContext(hasFormContext)
    } catch (e) {
      setIsFormContext(false)
    }
  }, [])

  // Создаем кнопку выбора диапазона дат
  const rangeButton = (
    <Button
      type="button"
      id="date"
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal",
        !from && !to && "text-muted-foreground",
        className
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {from ? (
        to ? (
          <>
            {format(from, "PPP", { locale: ru })} -{" "}
            {format(to, "PPP", { locale: ru })}
          </>
        ) : (
          format(from, "PPP", { locale: ru })
        )
      ) : (
        "Выберите диапазон дат"
      )}
    </Button>
  )

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          {isFormContext ? <FormControl>{rangeButton}</FormControl> : rangeButton}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={from}
            selected={{ from, to }}
            onSelect={(range) => {
              setDateRange(range || { from: undefined, to: undefined })
            }}
            numberOfMonths={2}
            locale={ru}
            required={false}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
