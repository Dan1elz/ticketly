export type {
  THttpMethod,
  TQueryParams,
  IApiResponse,
  IApiResponseError,
  IApiResponseTable,
  IIndexParams,
  IBaseService,
} from "./api.interface"

export type { IAdminUser, ILogin, ILoginResponse } from "./auth.interface"

export type {
  TSocialLinks,
  IArtist,
  IArtistPayload,
  IArtistUpdatePayload,
} from "./artist.interface"

export type {
  TEventStatus,
  TPerformanceType,
  TLineupStatus,
  IEventStage,
  ILineupItem,
  IEvent,
  ILineupItemPayload,
  IEventPayload,
  IEventUpdatePayload,
} from "./event.interface"

export type {
  TSectorType,
  TSeatStatus,
  TSeatCounts,
  ISector,
  ISectorPayload,
  TSectorUpdatePayload,
  ISeat,
  ISeatBlockPayload,
  ISeatQuantityPayload,
  ISeatNotePayload,
  TSeatAction,
  ISeatBatchResult,
} from "./sector.interface"

export type { IUploadedFile } from "./upload.interface"
