const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Функция для получения токена из сессии (для клиентских компонентов)
async function getAuthToken(): Promise<string | null> {
  // В клиентских компонентах можно использовать useSession из next-auth/react
  // Для серверных компонентов токен должен передаваться отдельно
  if (typeof window === 'undefined') {
    // Серверный компонент - токен должен быть передан через опции
    return null;
  }
  
  // Сначала пытаемся получить токен из localStorage или sessionStorage
  try {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      return token;
    }
  } catch {
    // Игнорируем ошибки при доступе к localStorage
  }

  // Если токена нет в localStorage, пытаемся получить из NextAuth сессии через API
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const session = await response.json();
      if (session?.user?.accessToken) {
        // Сохраняем токен в localStorage для последующих запросов
        localStorage.setItem('accessToken', session.user.accessToken);
        return session.user.accessToken;
      }
    }
  } catch {
    // Игнорируем ошибки при получении сессии
  }

  return null;
}

// Функция для установки токена из сессии NextAuth
export function setAuthTokenFromSession(token: string | undefined) {
  if (token && typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

export async function apiRequest(endpoint: string, options: RequestInit & { token?: string | null } = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Получаем токен авторизации - сначала из опций, потом из localStorage, потом из сессии
  let token = options.token;
  if (!token) {
    token = await getAuthToken();
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Добавляем токен авторизации, если он есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Удаляем token из options, чтобы не передавать его в fetch
  const { token: _, ...fetchOptions } = options;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Включаем cookies для CORS
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // Если не удалось распарсить JSON, используем текст ответа
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Игнорируем ошибки при чтении текста
      }
    }
    throw new Error(errorMessage);
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

