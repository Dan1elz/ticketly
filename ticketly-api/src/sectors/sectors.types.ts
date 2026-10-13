// Um assento a ser criado. Na pista, row/gridRow/gridColumn vão null
export interface ISeatData {
  row: string | null;
  number: number;
  gridRow: number | null;
  gridColumn: number | null;
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
