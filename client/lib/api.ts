const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Функция для получения токена из сессии (для клиентских компонентов)
async function getAuthToken(): Promise<string | null> {
  // В клиентских компонентах можно использовать useSession из next-auth/react
  // Для серверных компонентов токен должен передаваться отдельно
  if (typeof window === 'undefined') {
    // Серверный компонент - токен должен быть передан через опции
    return null;
  }
  
  // Пытаемся получить токен из localStorage или sessionStorage
  // В реальном приложении токен должен храниться безопасно
  try {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    return token;
  } catch {
    return null;
  }
}

// Функция для установки токена из сессии NextAuth
export function setAuthTokenFromSession(token: string | undefined) {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Получаем токен авторизации
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Добавляем токен авторизации, если он есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Включаем cookies для CORS
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}

// Функция для установки токена (вызывается после успешной авторизации)
export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

// Функция для удаления токена (вызывается при выходе)
export function removeAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  }
}

export const api = {
  get: (endpoint: string, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, body: any, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: (endpoint: string, body: any, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: (endpoint: string, options: RequestInit = {}) => 
    apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

