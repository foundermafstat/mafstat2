"use client"

import { useState, useEffect } from "react"
import { CreditCard, Search, Download, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"

// Типы для платежей и пользователей
interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentType: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  productId?: string;
  productName?: string;
  user?: User;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Загрузка платежей при монтировании компонента
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch("/api/admin/payments")
        const data = await response.json()
        
        if (!response.ok) {
          console.error("Ошибка API:", data)
          throw new Error(data.error || `Ошибка сервера: ${response.status}`)
        }
        
        console.log("Получены данные о платежах:", data)
        setPayments(data.payments || [])
      } catch (err: any) {
        console.error("Ошибка при загрузке платежей:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPayments()
  }, [])

  // Фильтрация платежей по поисковому запросу
  const filteredPayments = payments.filter(payment => 
    payment.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.user?.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payment.productName || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Функция для экспорта данных в CSV формат
  const exportToCSV = () => {
    // Заголовок для CSV файла
    const headers = [
      "ID", "Сумма", "Валюта", "Статус", "Тип платежа", 
      "ID пользователя", "Email пользователя", "Дата создания", 
      "Дата обновления", "ID сессии Stripe", "ID платежа Stripe", 
      "ID продукта", "Название продукта"
    ].join(",")
    
    // Преобразуем каждый платёж в строку CSV
    const csvRows = filteredPayments.map(payment => {
      return [
        payment.id || "",
        payment.amount || 0,
        payment.currency || "",
        payment.status || "",
        payment.paymentType || "",
        payment.userId || "",
        payment.user?.email || "",
        payment.createdAt || "",
        payment.updatedAt || "",
        payment.stripeSessionId || "",
        payment.stripePaymentIntentId || "",
        payment.productId || "",
        payment.productName || ""
      ].join(",")
    })
    
    // Объединяем все строки в один CSV контент
    const csvContent = [headers, ...csvRows].join("\n")
    
    // Создаём Blob для скачивания
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    
    // Создаём ссылку для скачивания
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `payments_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    
    // Добавляем ссылку, кликаем по ней и удаляем
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Функция для обновления статуса платежа
  const updatePaymentStatus = async (paymentId: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/update-payment-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Ошибка сервера");
      }
      
      toast({
        title: "Успех",
        description: data.message || "Статус платежа обновлен",
        variant: "default",
      });
      
      // Обновляем список платежей
      const fetchPayments = async () => {
        try {
          setLoading(true)
          setError(null)
          
          const response = await fetch("/api/admin/payments")
          const data = await response.json()
          
          if (!response.ok) {
            console.error("Ошибка API:", data)
            throw new Error(data.error || `Ошибка сервера: ${response.status}`)
          }
          
          console.log("Получены данные о платежах:", data)
          setPayments(data.payments || [])
        } catch (err: any) {
          console.error("Ошибка при загрузке платежей:", err)
          setError(err.message)
        } finally {
          setLoading(false)
        }
      }
      fetchPayments()
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false)
    }
  };

  // Функции отображения статуса платежа
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500">Выполнен</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">В обработке</Badge>
      case "failed":
        return <Badge className="bg-red-500">Ошибка</Badge>
      default:
        return <Badge className="bg-gray-500">{status || "Неизвестно"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">История платежей</h1>
        </div>

        <Button onClick={exportToCSV} disabled={payments.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Экспорт в CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Платежи</CardTitle>
          <CardDescription>Полная история платежей пользователей.</CardDescription>
          
          <div className="mt-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по ID, статусу, email или названию продукта..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="flex space-x-4">
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/4" />
                  <Skeleton className="h-12 w-1/4" />
                </div>
              ))}
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Продукт</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип платежа</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-xs">
                        {payment.id ? payment.id.substring(0, 8) + "..." : "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.user?.email || "Неизвестно"}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.userId ? payment.userId.substring(0, 8) + "..." : "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.productName || "—"}</TableCell>
                      <TableCell>{payment.amount || 0} {payment.currency || ""}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>{payment.paymentType || "—"}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                              >
                                Действия
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Подробности</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem onClick={() => {
                                toast({
                                  title: "Детали платежа",
                                  description: (
                                    <div className="space-y-2 mt-2">
                                      <p><strong>ID платежа:</strong> {payment.id}</p>
                                      <p><strong>Сумма:</strong> {payment.amount} {payment.currency}</p>
                                      <p><strong>Статус:</strong> {payment.status}</p>
                                      <p><strong>Тип платежа:</strong> {payment.paymentType}</p>
                                      <p><strong>Дата создания:</strong> {formatDate(payment.createdAt)}</p>
                                      {payment.user?.email && (
                                        <p><strong>Пользователь:</strong> {payment.user?.email}</p>
                                      )}
                                      {payment.stripeSessionId && (
                                        <p><strong>ID сессии Stripe:</strong> {payment.stripeSessionId}</p>
                                      )}
                                    </div>
                                  ),
                                  duration: 10000,
                                });
                              }}>
                                Показать детали
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-[200px] w-full items-center justify-center rounded-md border border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Платежи не найдены</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            Всего платежей: {filteredPayments.length} из {payments.length}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
