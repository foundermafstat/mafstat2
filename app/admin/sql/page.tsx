"use client"

import { useState, useRef } from "react"
import { 
  FileCode, 
  Play, 
  Database, 
  UploadIcon,
  TableIcon,
  AlertCircle,
  ChevronRight,
  ListChecks
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface QueryResult {
  success: boolean
  message?: string
  rows?: any[]
  columns?: string[]
  affectedRows?: number
  duration?: number
  error?: string
}

interface BatchQueryResult extends QueryResult {
  query: string
  index: number
}

export default function SqlPage() {
  const [sql, setSql] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [batchResults, setBatchResults] = useState<BatchQueryResult[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Функция для разделения SQL на отдельные команды
  const splitSqlCommands = (sqlText: string): string[] => {
    // Разделяем на команды по точке с запятой, но учитываем строки в кавычках и комментарии
    const commands: string[] = []
    let current = ""
    let inSingleQuote = false
    let inDoubleQuote = false
    let inComment = false
    
    for (let i = 0; i < sqlText.length; i++) {
      const char = sqlText[i]
      const nextChar = sqlText[i + 1] || ''
      
      // Обработка комментариев
      if (char === '-' && nextChar === '-' && !inSingleQuote && !inDoubleQuote && !inComment) {
        inComment = true
        current += char
        continue
      }
      
      // Конец комментария по переносу строки
      if (inComment && (char === '\n' || char === '\r')) {
        inComment = false
        current += char
        continue
      }
      
      // Обработка кавычек
      if (char === "'" && !inDoubleQuote && !inComment) {
        inSingleQuote = !inSingleQuote
        current += char
        continue
      }
      
      if (char === '"' && !inSingleQuote && !inComment) {
        inDoubleQuote = !inDoubleQuote
        current += char
        continue
      }
      
      // Обработка точки с запятой (конец команды)
      if (char === ';' && !inSingleQuote && !inDoubleQuote && !inComment) {
        current += char
        const trimmed = current.trim()
        if (trimmed) commands.push(trimmed)
        current = ""
        continue
      }
      
      current += char
    }
    
    // Добавляем последнюю команду, если она не пустая и не заканчивается точкой с запятой
    const trimmed = current.trim()
    if (trimmed) commands.push(trimmed)
    
    // Фильтруем пустые команды
    return commands.filter(cmd => cmd.trim().length > 0)
  }

  // Функция для выполнения одного SQL-запроса
  const executeSingleQuery = async (query: string): Promise<QueryResult> => {
    try {
      const response = await fetch('/api/admin/database/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка при выполнении запроса')
      }
      
      return data
    } catch (error) {
      console.error('Ошибка:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      }
    }
  }

  // Функция для выполнения SQL-запросов в пакетном режиме
  const executeBatchQueries = async () => {
    if (!sql.trim()) {
      toast({
        title: "Ошибка",
        description: "SQL-запрос не может быть пустым",
        variant: "destructive",
      })
      return
    }

    const commands = splitSqlCommands(sql)
    if (commands.length === 0) {
      toast({
        title: "Ошибка",
        description: "Не найдено ни одной SQL-команды",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setBatchMode(true)
    setBatchResults([])
    setBatchProgress(0)
    
    const results: BatchQueryResult[] = []
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim()
      if (!command) continue
      
      // Обновляем прогресс
      setBatchProgress(Math.round((i / commands.length) * 100))
      
      // Выполняем запрос
      const result = await executeSingleQuery(command)
      
      // Сохраняем результат
      const batchResult: BatchQueryResult = {
        ...result,
        query: command,
        index: i + 1
      }
      
      results.push(batchResult)
      setBatchResults(prev => [...prev, batchResult])
      
      if (result.success) {
        successCount++
      } else {
        errorCount++
      }
    }
    
    setBatchProgress(100)
    setLoading(false)
    
    // Показываем итоговое уведомление
    toast({
      title: "Выполнение завершено",
      description: `Успешно: ${successCount}, Ошибок: ${errorCount}`,
      variant: successCount > 0 ? "default" : "destructive",
    })
  }

  // Функция для выполнения одиночного SQL-запроса
  const executeQuery = async () => {
    if (!sql.trim()) {
      toast({
        title: "Ошибка",
        description: "SQL-запрос не может быть пустым",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setBatchMode(false)
    
    try {
      const result = await executeSingleQuery(sql)
      setResult(result)
      
      if (result.success) {
        toast({
          title: "Запрос выполнен",
          description: result.message || `Запрос успешно выполнен за ${result.duration}мс`,
        })
      } else {
        toast({
          title: "Ошибка выполнения запроса",
          description: result.error || 'Неизвестная ошибка',
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Функция для загрузки SQL-файла
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Проверяем тип файла
    if (file.type !== 'application/sql' && !file.name.endsWith('.sql')) {
      toast({
        title: "Неподдерживаемый формат файла",
        description: "Пожалуйста, загрузите файл с расширением .sql",
        variant: "destructive",
      })
      return
    }
    
    // Читаем содержимое файла
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        setSql(content)
        
        // Определяем количество команд
        const commandCount = splitSqlCommands(content).length
        
        toast({
          title: "Файл загружен",
          description: `Файл ${file.name} успешно загружен (${commandCount} команд)`,
        })
      }
    }
    reader.onerror = () => {
      toast({
        title: "Ошибка",
        description: "Не удалось прочитать файл",
        variant: "destructive",
      })
    }
    reader.readAsText(file)
  }

  // Открытие диалога выбора файла
  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SQL-запросы</h1>
          <p className="text-muted-foreground mt-2">
            Выполнение SQL-запросов к базе данных
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".sql"
            className="hidden"
          />
          <Button onClick={handleFileButtonClick} variant="outline">
            <UploadIcon className="mr-2 h-4 w-4" />
            Загрузить SQL-файл
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileCode className="mr-2 h-5 w-5 text-primary" />
            SQL-запрос
          </CardTitle>
          <CardDescription>
            Введите SQL-запрос для выполнения в базе данных
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT * FROM your_table;"
            className="font-mono h-40 resize-none"
          />
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-sm text-muted-foreground">
            <AlertCircle className="inline-block mr-1 h-4 w-4" />
            Будьте осторожны при выполнении запросов на изменение данных (INSERT, UPDATE, DELETE)
          </div>
          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={loading} variant="outline">
              {loading && !batchMode ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Выполнение...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Выполнить как один запрос
                </>
              )}
            </Button>
            <Button onClick={executeBatchQueries} disabled={loading}>
              {loading && batchMode ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Выполнение...
                </>
              ) : (
                <>
                  <ListChecks className="mr-2 h-4 w-4" />
                  Выполнить как пакет команд
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Отображение прогресса для пакетного режима */}
      {batchMode && loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Выполнение пакета команд</span>
                <span>{batchProgress}%</span>
              </div>
              <Progress value={batchProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Результаты в пакетном режиме */}
      {batchMode && batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListChecks className="mr-2 h-5 w-5 text-primary" />
              Результаты выполнения пакета
            </CardTitle>
            <CardDescription>
              Выполнено {batchResults.length} из {splitSqlCommands(sql).length} команд
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {batchResults.map((result, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Успех" : "Ошибка"}
                      </Badge>
                      <span className="font-mono text-sm">
                        {result.query.length > 60 
                          ? result.query.substring(0, 60) + "..." 
                          : result.query}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-4">
                      <div className="font-mono text-sm border p-2 rounded bg-muted/50 whitespace-pre-wrap">
                        {result.query}
                      </div>
                      
                      {!result.success && result.error && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Ошибка</AlertTitle>
                          <AlertDescription>
                            {result.error}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {result.success && result.rows && result.rows.length > 0 && (
                        <div className="border rounded max-h-64 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {result.columns?.map((column, colIndex) => (
                                  <TableHead key={colIndex}>{column}</TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.rows.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                  {result.columns?.map((column, colIndex) => (
                                    <TableCell key={colIndex}>
                                      {formatValue(row[column])}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                      
                      {result.success && (
                        <div className="text-sm">
                          {result.affectedRows !== undefined 
                            ? `Затронуто строк: ${result.affectedRows}` 
                            : result.rows 
                              ? `Получено строк: ${result.rows.length}` 
                              : 'Запрос успешно выполнен'}
                          {result.duration !== undefined && ` (${result.duration}мс)`}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Результат отдельного запроса */}
      {!batchMode && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5 text-primary" />
              Результат запроса
            </CardTitle>
            <CardDescription>
              {result.success 
                ? `Запрос выполнен за ${result.duration}мс${result.affectedRows !== undefined ? `, затронуто строк: ${result.affectedRows}` : ''}`
                : 'Произошла ошибка при выполнении запроса'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!result.success && result.error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription>
                  {result.error}
                </AlertDescription>
              </Alert>
            )}
            
            {result.success && result.rows && result.rows.length > 0 && (
              <ScrollArea className="h-96 w-full rounded-md border">
                <div className="p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {result.columns?.map((column, colIndex) => (
                          <TableHead key={colIndex}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {result.columns?.map((column, colIndex) => (
                            <TableCell key={colIndex}>
                              {formatValue(row[column])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            )}
            
            {result.success && (!result.rows || result.rows.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {result.affectedRows !== undefined 
                  ? `Запрос успешно выполнен. Затронуто строк: ${result.affectedRows}`
                  : 'Запрос не вернул данных'
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Toaster />
    </div>
  )
}

// Форматирование значения для отображения в таблице
function formatValue(value: any): string {
  if (value === null) return 'NULL'
  if (typeof value === 'object') {
    if (value instanceof Date) return value.toLocaleString()
    return JSON.stringify(value)
  }
  return String(value)
}
