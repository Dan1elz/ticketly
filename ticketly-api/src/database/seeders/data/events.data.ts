import { EEventStatus } from '../../../events/enums/event-status.enum';
import { ELineupStatus } from '../../../events/enums/lineup-status.enum';
import { EPerformanceType } from '../../../events/enums/performance-type.enum';

export interface ILineupSeed {
  artist: string;
  stage?: string;
  performanceType: EPerformanceType;
  startTime: Date;
  endTime: Date;
  status?: ELineupStatus;
}

export interface IEventSeed {
  name: string;
  venue: string;
  startsAt: Date;
  status: EEventStatus;
  lineup: ILineupSeed[];
}

// Horário de Brasília: at('2026-11-14', '21:30')
const at = (date: string, time: string) => new Date(`${date}T${time}:00-03:00`);

const { HEADLINER, SUPPORT, DJ } = EPerformanceType;

export const EVENTS: IEventSeed[] = [
  {
    name: 'Festival Maré Alta 2026',
    venue: 'Parque Villa-Lobos — São Paulo',
    startsAt: at('2026-11-14', '14:00'),
    status: EEventStatus.PUBLISHED,
    lineup: [
      {
        artist: 'Brisa Tropical',
        stage: 'Palco Areia',
        performanceType: SUPPORT,
        startTime: at('2026-11-14', '16:00'),
        endTime: at('2026-11-14', '17:00'),
      },
      {
        artist: 'Dandara Sol',
        stage: 'Palco Oceano',
        performanceType: SUPPORT,
        startTime: at('2026-11-14', '17:30'),
        endTime: at('2026-11-14', '18:30'),
      },
      {
        artist: 'Marina Silveira',
        stage: 'Palco Areia',
        performanceType: SUPPORT,
        startTime: at('2026-11-14', '18:30'),
        endTime: at('2026-11-14', '19:30'),
      },
      {
        artist: 'Luna Marés',
        stage: 'Palco Oceano',
        performanceType: SUPPORT,
        startTime: at('2026-11-14', '19:30'),
        endTime: at('2026-11-14', '20:45'),
      },
      {
        artist: 'KAYRA',
        stage: 'Palco Oceano',
        performanceType: HEADLINER,
        startTime: at('2026-11-14', '21:30'),
        endTime: at('2026-11-14', '23:00'),
      },
      {
        artist: 'Aura Beat',
        stage: 'Palco Areia',
        performanceType: DJ,
        startTime: at('2026-11-14', '23:00'),
        endTime: at('2026-11-15', '01:00'),
      },
    ],
  },
  {
    name: 'V$TOR — Turnê Zona Leste',
    venue: 'Audio — São Paulo',
    startsAt: at('2026-11-21', '22:00'),
    status: EEventStatus.PUBLISHED,
    lineup: [
      {
        artist: 'MC Pardal',
        performanceType: SUPPORT,
        startTime: at('2026-11-21', '22:00'),
        endTime: at('2026-11-21', '22:45'),
      },
      {
        artist: 'V$TOR',
        performanceType: HEADLINER,
        startTime: at('2026-11-21', '23:15'),
        endTime: at('2026-11-22', '00:45'),
      },
    ],
  },
  {
    name: 'Noite Sombria: Post-Punk & Dark Wave',
    venue: 'Fabrique Club — São Paulo',
    startsAt: at('2026-11-28', '21:00'),
    status: EEventStatus.PUBLISHED,
    lineup: [
      {
        artist: 'Aurora Fria',
        performanceType: SUPPORT,
        startTime: at('2026-11-28', '21:45'),
        endTime: at('2026-11-28', '22:40'),
      },
      {
        artist: 'Chuva Ácida',
        performanceType: HEADLINER,
        startTime: at('2026-11-28', '23:00'),
        endTime: at('2026-11-29', '00:15'),
      },
    ],
  },
  {
    name: 'Marina Silveira — Ao Vivo no Teatro',
    venue: 'Teatro Castro Alves — Salvador',
    startsAt: at('2026-12-05', '20:00'),
    status: EEventStatus.PUBLISHED,
    lineup: [
      {
        artist: 'Theo Vasconcellos',
        performanceType: SUPPORT,
        startTime: at('2026-12-05', '20:00'),
        endTime: at('2026-12-05', '20:40'),
      },
      {
        artist: 'Marina Silveira',
        performanceType: HEADLINER,
        startTime: at('2026-12-05', '21:00'),
        endTime: at('2026-12-05', '22:30'),
      },
    ],
  },
  {
    name: 'Batalha & Boom Bap',
    venue: 'Viaduto Santa Tereza — Belo Horizonte',
    startsAt: at('2026-12-12', '19:00'),
    status: EEventStatus.PUBLISHED,
    lineup: [
      {
        artist: 'Nômade Estelar',
        performanceType: DJ,
        startTime: at('2026-12-12', '19:00'),
        endTime: at('2026-12-12', '20:00'),
      },
      {
        artist: 'MC Pardal',
        performanceType: SUPPORT,
        startTime: at('2026-12-12', '20:15'),
        endTime: at('2026-12-12', '21:00'),
      },
      {
        artist: 'Zeus da Rima',
        performanceType: HEADLINER,
        startTime: at('2026-12-12', '21:30'),
        endTime: at('2026-12-12', '23:00'),
      },
    ],
  },
  {
    name: 'Rock na Garagem',
    venue: 'Cine Joia — São Paulo',
    startsAt: at('2027-01-16', '21:00'),
    status: EEventStatus.DRAFT,
    lineup: [
      {
        artist: 'Chuva Ácida',
        performanceType: SUPPORT,
        startTime: at('2027-01-16', '21:30'),
        endTime: at('2027-01-16', '22:20'),
      },
      {
        artist: 'Bento & Os Canibais',
        performanceType: HEADLINER,
        startTime: at('2027-01-16', '22:45'),
        endTime: at('2027-01-17', '00:15'),
      },
    ],
  },
  {
    name: 'Sertanejo na Arena',
    venue: 'Goiânia Arena — Goiânia',
    startsAt: at('2027-02-06', '20:00'),
    status: EEventStatus.DRAFT,
    lineup: [
      {
        artist: 'Theo Vasconcellos',
        performanceType: SUPPORT,
        startTime: at('2027-02-06', '20:30'),
        endTime: at('2027-02-06', '21:15'),
      },
      {
        artist: 'Túlio & Murilo',
        performanceType: HEADLINER,
        startTime: at('2027-02-06', '22:00'),
        endTime: at('2027-02-06', '23:45'),
      },
    ],
  },
  {
    name: 'Lo-Fi Sessions',
    venue: 'Blue Note — São Paulo',
    startsAt: at('2027-03-06', '20:00'),
    status: EEventStatus.DRAFT,
    lineup: [
      {
        artist: 'Luna Marés',
        performanceType: SUPPORT,
        startTime: at('2027-03-06', '20:00'),
        endTime: at('2027-03-06', '20:50'),
      },
      {
        artist: 'Dandara Sol',
        performanceType: SUPPORT,
        startTime: at('2027-03-06', '21:00'),
        endTime: at('2027-03-06', '21:45'),
        status: ELineupStatus.CANCELLED,
      },
      {
        artist: 'Nômade Estelar',
        performanceType: HEADLINER,
        startTime: at('2027-03-06', '22:00'),
        endTime: at('2027-03-06', '23:30'),
      },
    ],
  },
];
