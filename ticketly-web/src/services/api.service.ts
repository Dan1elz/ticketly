import { API_TIMEOUT_MS, API_URL } from "@/configs/api"
import type {
  IApiResponse,
  IApiResponseError,
  THttpMethod,
  TQueryParams,
} from "@/interfaces"

function getHeaders(token?: string, isFormData = false): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" }

  // Com FormData o próprio navegador monta o Content-Type (com o boundary)
  if (!isFormData) {
    headers["Content-Type"] = "application/json"
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

// Ignora null/undefined pra não mandar "?status=undefined" pra API
function buildQuery(params?: TQueryParams): string {
  if (!params) return ""

  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      search.append(key, String(value))
    }
  })

  const query = search.toString()
  return query ? `?${query}` : ""
}

function parseJson(text: string): unknown {
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function isNestError(content: unknown): content is IApiResponseError {
  return (
    typeof content === "object" &&
    content !== null &&
    "statusCode" in content &&
    "message" in content
  )
}

export class ApiError extends Error {
  status: number
  messages: string[]

  constructor(status: number, message: string | string[]) {
    const messages = Array.isArray(message) ? message : [message]

    super(messages[0] ?? "Erro na requisição")
    this.name = "ApiError"
    this.status = status
    this.messages = messages
  }

  // status 0 = nem chegou na API (offline, CORS, timeout)
  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  // 409 = conflito, ex: assento que outra pessoa acabou de reservar
  get isConflict(): boolean {
    return this.status === 409
  }

  get isValidationError(): boolean {
    return this.status === 400 || this.status === 422
  }

  getAllErrors(): string[] {
    return this.messages
  }
}

/**
 * O ApiService não é React, então não consegue chamar o logout() direto.
 * O AuthProvider registra aqui o que fazer quando a API devolver 401.
 * @returns função pra remover o handler (usada no cleanup do useEffect)
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void): () => void {
  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null
  }
}

export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    method: THttpMethod,
    uri: string,
    body?: unknown,
    token?: string,
    params?: TQueryParams,
    isFormData = false
  ): Promise<IApiResponse<T>> {
    const fullUrl = `${this.baseUrl}/${uri.replace(/^\//, "")}${buildQuery(params)}`

    let response: Response

    try {
      response = await fetch(fullUrl, {
        method,
        headers: getHeaders(token, isFormData),
        body: isFormData
          ? (body as FormData)
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      })
    } catch (error) {
      const isTimeout =
        error instanceof DOMException && error.name === "TimeoutError"

      throw new ApiError(
        0,
        isTimeout
          ? "A API demorou demais para responder"
          : "Não foi possível conectar com a API"
      )
    }

    const content = parseJson(await response.text())

    // Só conta como "sessão expirou" se mandamos token — um 401 no login
    // (senha errada) não deve deslogar ninguém
    if (response.status === 401 && token) {
      unauthorizedHandler?.()
    }

    if (!response.ok) {
      if (isNestError(content)) {
        throw new ApiError(content.statusCode, content.message)
      }

      throw new ApiError(response.status, "Erro na requisição")
    }

    // 204 No Content / corpo vazio: não tem data
    return { status: response.status, data: content as T }
  }

  public get<T>(uri: string, params?: TQueryParams, token?: string) {
    return this.request<T>("GET", uri, undefined, token, params)
  }

  public post<T>(
    uri: string,
    body?: unknown,
    token?: string,
    isFormData?: boolean
  ) {
    return this.request<T>("POST", uri, body, token, undefined, isFormData)
  }

  public put<T>(uri: string, body: unknown, token?: string) {
    return this.request<T>("PUT", uri, body, token)
  }

  public patch<T>(uri: string, body: unknown, token?: string) {
    return this.request<T>("PATCH", uri, body, token)
  }

  public delete<T>(uri: string, token?: string) {
    return this.request<T>("DELETE", uri, undefined, token)
  }
}
