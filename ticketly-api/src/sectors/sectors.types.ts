import type { ESectorType } from './enums/sector-type.enum';

// Dados que as entidades recebem no create/update. A entidade não conhece DTO:
// o service passa o DTO direto e o TypeScript confere se os campos batem

export interface ISectorData {
  name: string;
  type: ESectorType;
  description: string | null;
  priceCents: number;
  color: string;
  displayOrder: number;
  maxPerOrder: number | null;
}

// PATCH: só o que veio muda. O tipo fica de fora: os assentos já foram
// gerados no formato dele (grade ou pista)
export interface ISectorChanges {
  name?: string;
  description?: string | null;
  priceCents?: number;
  color?: string;
  displayOrder?: number;
  maxPerOrder?: number | null;
}

// Um assento a ser criado. Na pista, row/gridRow/gridColumn vão null
export interface ISeatData {
  row: string | null;
  number: number;
  gridRow: number | null;
  gridColumn: number | null;
  isAccessible: boolean;
}

// Bloco de assentos de um setor SEATED (ver CreateSeatBlockDto)
export interface ISeatBlockData {
  rows: string[];
  numberStart: number;
  numberEnd: number;
  gridRowStart: number;
  gridColumnStart: number;
  isAccessible: boolean;
}

// Quantos assentos o setor (ou o evento) tem em cada status
export interface ISeatCounts {
  AVAILABLE: number;
  RESERVED: number;
  SOLD: number;
  BLOCKED: number;
  CANCELLED: number;
  total: number;
}
