import type { Artist } from '../artists/entities/artist.entity';
import type { EEventStatus } from './enums/event-status.enum';
import type { ELineupStatus } from './enums/lineup-status.enum';
import type { EPerformanceType } from './enums/performance-type.enum';

// Dados que as entidades recebem no create/update. A entidade não conhece DTO:
// o service passa o DTO direto e o TypeScript confere se os campos batem

export interface IEventData {
  name: string;
  venue: string;
  startsAt: Date;
}

// PATCH: só o que veio muda
export interface IEventChanges {
  name?: string;
  venue?: string;
  startsAt?: Date;
  status?: EEventStatus;
}

export interface IEventStageData {
  name: string;
  displayOrder: number;
}

// Campos que o lineup grava direto (artista e palco chegam já como entidades)
export interface ILineupItemData {
  performanceType: EPerformanceType;
  startTime: Date | null;
  endTime: Date | null;
  displayOrder: number;
  status: ELineupStatus;
}

// Item do lineup com o artista já resolvido pelo service. O palco segue pelo
// nome: só o Event acha o palco, que pode ter sido criado no mesmo request
export interface ILineupEntry extends ILineupItemData {
  artist: Artist;
  stage: string;
}
