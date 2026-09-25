import type {
  IApiResponseTable,
  IBaseService,
  IIndexParams,
  TQueryParams,
} from "@/interfaces"
import { ApiService } from "./api.service"

/**
 * CRUD genérico de um recurso. Cada service específico estende esse:
 *
 * @example
 * class EventService extends BaseService<IEvent> {
 *   constructor() { super("admin/events") }
 * }
 */
export class BaseService<T> implements IBaseService<T> {
  protected endpoint: string
  protected apiService: ApiService

  constructor(endpoint: string) {
    this.endpoint = endpoint
    this.apiService = new ApiService()
  }

  async getAll(
    params?: IIndexParams,
    token?: string
  ): Promise<IApiResponseTable<T>> {
    const page = params?.page ?? 1
    const perPage = params?.perPage ?? 10

    const query: TQueryParams = {
      ...params?.filters,
      page,
      perPage,
    }

    const response = await this.apiService.get<IApiResponseTable<T>>(
      this.endpoint,
      query,
      token
    )
    return response.data
  }

  async getById(id: string, token?: string): Promise<T> {
    const response = await this.apiService.get<T>(
      `${this.endpoint}/${id}`,
      undefined,
      token
    )
    return response.data
  }

  async create(data: Partial<T>, token?: string): Promise<T> {
    const response = await this.apiService.post<T>(this.endpoint, data, token)
    return response.data
  }

  async update(id: string, data: Partial<T>, token?: string): Promise<T> {
    const response = await this.apiService.patch<T>(
      `${this.endpoint}/${id}`,
      data,
      token
    )
    return response.data
  }

  async delete(id: string, token?: string): Promise<void> {
    await this.apiService.delete<void>(`${this.endpoint}/${id}`, token)
  }
}
