"use client"

import { useState, useEffect } from "react"
import { 
  Database, 
  RefreshCw, 
  Table as TableIcon, 
  Database as DatabaseIcon,
  FileCode,
  ChevronDown,
  ChevronRight,
  Download,
  Save
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ScrollArea } from "@/components/ui/scroll-area"

// Типы для работы с базой данных
type TableInfo = {
  name: string
  comment?: string
  rowCount: number
}

type ColumnInfo = {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  constraint_type: string | null
}

type TableData = {
  [key: string]: any
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [columns, setColumns] = useState<ColumnInfo[]>([])
  const [tableData, setTableData] = useState<TableData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStructure, setLoadingStructure] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [activeTab, setActiveTab] = useState("structure")
  const [dbInfo, setDbInfo] = useState<{ name: string, size: string, tables: number }>({
    name: "",
    size: "",
    tables: 0
  })
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [backupData, setBackupData] = useState<{
    sql: string;
    metadata: {
      timestamp: string;
      tables: number;
      records: number;
    }
  } | null>(null)

  // Загрузка списка таблиц
  const fetchTables = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/database/tables')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Ошибка при загрузке таблиц')
      }
      
      const data = await response.json()
      
      // Проверяем формат полученных данных
      if (!data.tables || !Array.isArray(data.tables)) {
        console.error('Неверный формат данных:', data)
        throw new Error('Неверный формат данных от API')
      }
      
      // Нормализуем данные таблиц
      const normalizedTables = data.tables.map((table: any) => ({
        name: table.name || 'unknown',
        rowCount: typeof table.rowCount === 'number' ? table.rowCount : 0
      }))
      
      setTables(normalizedTables)
      setDbInfo({
        name: data.database?.name || "neon",
        size: data.database?.size || "Неизвестно",
        tables: normalizedTables.length
      })
    } catch (error: any) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка при загрузке таблиц",
        description: error.message || "Не удалось загрузить список таблиц",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Загрузка структуры таблицы
  const fetchTableStructure = async (tableName: string) => {
    setLoadingStructure(true)
    try {
      const response = await fetch(`/api/admin/database/tables/${tableName}/structure`)
      if (!response.ok) {
        throw new Error('Ошибка при загрузке структуры таблицы')
      }
      const data = await response.json()
      setColumns(data.columns)
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить структуру таблицы",
        variant: "destructive",
      })
    } finally {
      setLoadingStructure(false)
    }
  }

  // Загрузка данных таблицы
  const fetchTableData = async (tableName: string) => {
    setLoadingData(true)
    try {
      const response = await fetch(`/api/admin/database/tables/${tableName}/data?limit=100`)
      if (!response.ok) {
        throw new Error('Ошибка при загрузке данных таблицы')
      }
      const data = await response.json()
      setTableData(data.rows)
    } catch (error) {
      console.error('Ошибка:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные таблицы",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])

  // При выборе таблицы загружаем ее структуру и данные
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName)
    fetchTableStructure(tableName)
    fetchTableData(tableName)
  }

  // Форматирование типа данных для отображения
  const formatDataType = (dataType: string) => {
    // Удаляем "character varying" -> "varchar"
    if (dataType.includes("character varying")) {
      return dataType.replace("character varying", "varchar")
    }
    return dataType
  }

  // Получение названия ограничения в понятном виде
  const getConstraintLabel = (type: string | null) => {
    if (!type) return null
    
    const labels: Record<string, { label: string, className: string }> = {
      "PRIMARY KEY": { label: "PK", className: "bg-blue-100 text-blue-800 border-blue-200" },
      "FOREIGN KEY": { label: "FK", className: "bg-purple-100 text-purple-800 border-purple-200" },
      "UNIQUE": { label: "UQ", className: "bg-amber-100 text-amber-800 border-amber-200" },
      "CHECK": { label: "CK", className: "bg-green-100 text-green-800 border-green-200" },
    }
    
    return labels[type] || { label: type, className: "bg-gray-100 text-gray-800 border-gray-200" }
  }

  // Определение типа значения для отображения в таблице данных
  const getValueType = (value: any): string => {
    if (value === null) return 'null'
    if (typeof value === 'object') {
      if (value instanceof Date) return 'date'
      return 'object'
    }
    return typeof value
  }

  // Форматирование значения для отображения в таблице данных
  const formatValue = (value: any): string => {
    const valueType = getValueType(value);
    
    if (valueType === 'null') return 'NULL';
    if (valueType === 'object') return JSON.stringify(value, null, 2);
    
    return String(value);
  }

  // Функция для создания резервной копии базы данных
  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await fetch('/api/admin/database/backup');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ошибка при создании резервной копии');
      }
      
      const data = await response.json();
      setBackupData(data);
      
      toast({
        title: "Резервная копия создана",
        description: `Создана резервная копия: ${data.metadata.tables} таблиц, ${data.metadata.records} записей.`,
      });
    } catch (error: any) {
      console.error('Ошибка при создании резервной копии:', error);
      toast({
        title: "Ошибка при создании резервной копии",
        description: error.message || "Не удалось создать резервную копию базы данных",
        variant: "destructive",
      });
    } finally {
      setCreatingBackup(false);
    }
  };
  
  // Функция для скачивания SQL файла с бэкапом
  const downloadBackup = () => {
    if (!backupData) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `backup_${dbInfo.name}_${timestamp}.sql`;
    
    // Создаем элемент для скачивания
    const element = document.createElement('a');
    const file = new Blob([backupData.sql], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Скачивание начато",
      description: `Файл ${fileName} скачивается.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Управление базой данных</h1>
          <p className="text-muted-foreground mt-2">
            Просмотр структуры базы данных и таблиц
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchTables} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              <div className="flex items-center">
                <DatabaseIcon className="w-4 h-4 mr-2" />
                Информация о базе данных
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Название:</span>
                <span>{dbInfo.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Размер:</span>
                <span>{dbInfo.size}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Таблицы:</span>
                <span>{dbInfo.tables}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Резервное копирование:</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={createBackup}
                  disabled={creatingBackup}
                >
                  {creatingBackup ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Создать
                    </>
                  )}
                </Button>
              </div>
              {backupData && (
                <div className="pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full" 
                    onClick={downloadBackup}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Скачать SQL файл
                  </Button>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div>Создан: {new Date(backupData.metadata.timestamp).toLocaleString()}</div>
                    <div>Таблиц: {backupData.metadata.tables}</div>
                    <div>Записей: {backupData.metadata.records}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TableIcon className="mr-2 h-5 w-5 text-primary" />
              Список таблиц
            </CardTitle>
            <CardDescription>
              Выберите таблицу для просмотра ее структуры и данных
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Таблица</TableHead>
                      <TableHead>Строк</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          Таблицы не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      tables.map((table) => (
                        <TableRow key={table.name} className={selectedTable === table.name ? "bg-muted/50" : ""}>
                          <TableCell className="font-medium">{table.name}</TableCell>
                          <TableCell>{table.rowCount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleSelectTable(table.name)}
                            >
                              Просмотр
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileCode className="mr-2 h-5 w-5 text-primary" />
              Таблица: {selectedTable}
            </CardTitle>
            <CardDescription>
              Структура и данные таблицы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="structure">Структура</TabsTrigger>
                <TabsTrigger value="data">Данные</TabsTrigger>
              </TabsList>

              <TabsContent value="structure" className="space-y-4">
                {loadingStructure ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/4">Колонка</TableHead>
                          <TableHead className="w-1/4">Тип данных</TableHead>
                          <TableHead className="w-1/4">Nullable</TableHead>
                          <TableHead className="w-1/4">По умолчанию</TableHead>
                          <TableHead className="w-1/4">Ограничения</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columns.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              Колонки не найдены
                            </TableCell>
                          </TableRow>
                        ) : (
                          columns.map((column, index) => {
                            const constraint = getConstraintLabel(column.constraint_type)
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{column.column_name}</TableCell>
                                <TableCell>{formatDataType(column.data_type)}</TableCell>
                                <TableCell>
                                  {column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                                </TableCell>
                                <TableCell>
                                  {column.column_default !== null ? (
                                    <code className="px-1 py-0.5 rounded bg-muted text-sm">
                                      {column.column_default}
                                    </code>
                                  ) : (
                                    <span className="text-muted-foreground">Нет</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {constraint ? (
                                    <Badge variant="outline" className={constraint.className}>
                                      {constraint.label}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">Нет</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="data">
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          {tableData.length > 0 && (
                            <TableRow>
                              {Object.keys(tableData[0]).map((key) => (
                                <TableHead key={key}>{key}</TableHead>
                              ))}
                            </TableRow>
                          )}
                        </TableHeader>
                        <TableBody>
                          {tableData.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
                                Данные не найдены
                              </TableCell>
                            </TableRow>
                          ) : (
                            tableData.map((row, rowIndex) => (
                              <TableRow key={rowIndex}>
                                {Object.entries(row).map(([key, value], colIndex) => {
                                  const valueType = getValueType(value)
                                  const formattedValue = formatValue(value)
                                  
                                  return (
                                    <TableCell key={`${rowIndex}-${colIndex}`}>
                                      {valueType === 'null' ? (
                                        <span className="text-muted-foreground italic">NULL</span>
                                      ) : valueType === 'object' ? (
                                        <Collapsible>
                                          <CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground">
                                            <ChevronRight className="h-3 w-3 mr-1" />
                                            Object
                                          </CollapsibleTrigger>
                                          <CollapsibleContent>
                                            <pre className="mt-1 text-xs p-2 bg-muted rounded-md overflow-x-auto">
                                              {formattedValue}
                                            </pre>
                                          </CollapsibleContent>
                                        </Collapsible>
                                      ) : (
                                        <span className={valueType === 'number' ? 'font-mono' : ''}>
                                          {formattedValue}
                                        </span>
                                      )}
                                    </TableCell>
                                  )
                                })}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
                {tableData.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Показано {tableData.length} записей (максимум 100)
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </div>
  )
}
