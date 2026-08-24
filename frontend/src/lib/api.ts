const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const TOKEN_KEY = "ltm_token"

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  isForm?: boolean
  params?: Record<string, string | number | undefined>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isForm = false, params } = options

  let url = `${API_URL}${path}`
  if (params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value))
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (!isForm && body) headers["Content-Type"] = "application/json"

  const response = await fetch(url, {
    method,
    headers,
    body: isForm ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let detail = response.statusText
    try {
      const data = await response.json()
      detail = data.detail || detail
    } catch {
      // ignore
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) return undefined as T
  return response.json()
}
