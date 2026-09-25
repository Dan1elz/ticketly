export type THttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type TQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>

export interface IApiResponse<T> {
  status: number
  data: T
}

/**
 * Formato padrão de erro do NestJS:
 * { statusCode: 400, message: ["email must be an email"], error: "Bad Request" }
 * O message vem como array quando é erro de validação (class-validator)
 */
export interface IApiResponseError {
  statusCode: number
  message: string | string[]
  error?: string
}

export interface IApiResponseTable<T> {
  total: number
  items: T[]
}

export interface IIndexParams {
  filters?: TQueryParams
  page?: number
  perPage?: number
}

export interface IBaseService<T> {
  getAll: (
    params?: IIndexParams,
    token?: string
  ) => Promise<IApiResponseTable<T>>
  getById: (id: string, token?: string) => Promise<T>
  create: (data: Partial<T>, token?: string) => Promise<T>
  update: (id: string, data: Partial<T>, token?: string) => Promise<T>
  delete: (id: string, token?: string) => Promise<void>
}
