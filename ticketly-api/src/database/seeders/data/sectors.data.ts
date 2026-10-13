import { ESectorType } from '../../../sectors/enums/sector-type.enum';
import type { CreateSeatBlockDto } from '../../../sectors/dto/create-seat-block.dto';
import type { CreateSectorDto } from '../../../sectors/dto/create-sector.dto';

// Setor SEATED usa `blocks`; setor GENERAL_ADMISSION (pista) usa `quantity`
export interface ISectorSeed extends CreateSectorDto {
  blocks: CreateSeatBlockDto[];
  quantity: number;
}

interface ISectorSeedOptions {
  description?: string;
  maxPerOrder?: number;
}

// Pista: só a quantidade de ingressos
function general(
  displayOrder: number,
  name: string,
  priceCents: number,
  color: string,
  quantity: number,
  options: ISectorSeedOptions = {},
): ISectorSeed {
  return {
    name,
    type: ESectorType.GENERAL_ADMISSION,
    description: options.description ?? null,
    priceCents,
    color,
    displayOrder,
    maxPerOrder: options.maxPerOrder ?? null,
    blocks: [],
    quantity,
  };
}

// Lugar marcado: os assentos saem dos blocos da grade
function seated(
  displayOrder: number,
  name: string,
  priceCents: number,
  color: string,
  blocks: CreateSeatBlockDto[],
  options: ISectorSeedOptions = {},
): ISectorSeed {
  return {
    name,
    type: ESectorType.SEATED,
    description: options.description ?? null,
    priceCents,
    color,
    displayOrder,
    maxPerOrder: options.maxPerOrder ?? null,
    blocks,
    quantity: 0,
  };
}

// block(['A', 'B'], 1, 10, 1, 1) → fileiras A e B, números 1 a 10,
// começando na linha 1 e coluna 1 da grade
function block(
  rows: string[],
  numberStart: number,
  numberEnd: number,
  gridRowStart: number,
  gridColumnStart: number,
  isAccessible = false,
): CreateSeatBlockDto {
  return {
    rows,
    numberStart,
    numberEnd,
    gridRowStart,
    gridColumnStart,
    isAccessible,
  };
}

// rowsFrom('A', 'D') → ['A', 'B', 'C', 'D']
const rowsFrom = (first: string, last: string) =>
  Array.from({ length: last.charCodeAt(0) - first.charCodeAt(0) + 1 }, (_, i) =>
    String.fromCharCode(first.charCodeAt(0) + i),
  );

// Layouts por tipo de lugar. Preços em centavos

const FESTIVAL = [
  general(1, 'Pista', 18000, '#22C55E', 800),
  general(2, 'Pista Premium', 35000, '#F59E0B', 200, {
    description: 'Área em frente aos palcos',
    maxPerOrder: 4,
  }),
  general(3, 'Camarote', 65000, '#7C3AED', 60, {
    description: 'Open bar e banheiros exclusivos',
    maxPerOrder: 2,
  }),
];

// Casa de show: pista embaixo e mezanino com lugar marcado em cima
const CLUB = [
  general(1, 'Pista', 12000, '#22C55E', 300, { maxPerOrder: 6 }),
  seated(2, 'Mezanino', 20000, '#3B82F6', [
    block(rowsFrom('A', 'C'), 1, 12, 1, 1),
  ]),
];

// Teatro: plateia com corredor no meio (coluna 11 vazia) e fileira de
// acessibilidade na frente; balcão menor atrás
const THEATER = [
  seated(
    1,
    'Plateia',
    24000,
    '#EF4444',
    [
      block(['AA'], 1, 4, 1, 1, true),
      block(rowsFrom('A', 'J'), 1, 10, 2, 1),
      block(rowsFrom('A', 'J'), 11, 20, 2, 12),
    ],
    { description: 'Corredor central; fileira AA para cadeirantes' },
  ),
  seated(2, 'Balcão', 14000, '#0EA5E9', [
    block(rowsFrom('A', 'D'), 1, 16, 1, 1),
  ]),
];

const ARENA = [
  general(1, 'Pista', 15000, '#22C55E', 1000),
  general(2, 'Pista Premium', 28000, '#F59E0B', 300, { maxPerOrder: 4 }),
  seated(3, 'Cadeira Inferior', 22000, '#3B82F6', [
    block(rowsFrom('A', 'H'), 1, 12, 1, 1),
    block(rowsFrom('A', 'H'), 13, 24, 1, 14),
  ]),
];

// Pelo nome do show em events.data.ts
export const SECTORS_BY_EVENT: Record<string, ISectorSeed[]> = {
  'Festival Maré Alta 2026': FESTIVAL,
  'V$TOR — Turnê Zona Leste': CLUB,
  'Noite Sombria: Post-Punk & Dark Wave': CLUB,
  'Marina Silveira — Ao Vivo no Teatro': THEATER,
  'Batalha & Boom Bap': FESTIVAL,
  'Rock na Garagem': CLUB,
  'Sertanejo na Arena': ARENA,
  'Lo-Fi Sessions': THEATER,
};
