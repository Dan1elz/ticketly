import type {
  IArtist,
  IArtistPayload,
  IArtistUpdatePayload,
} from "@/interfaces"
import { BaseService } from "./base.service"

class ArtistService extends BaseService<
  IArtist,
  IArtistPayload,
  IArtistUpdatePayload
> {
  constructor() {
    super("artists")
  }
}

export const artistService = new ArtistService()
