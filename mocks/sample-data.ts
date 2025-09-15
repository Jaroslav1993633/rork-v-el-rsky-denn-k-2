import type { Hive, Inspection, Task, Yield } from '@/types/beekeeping';

export const sampleHives: Hive[] = [
  {
    id: '1',
    name: 'Úľ č. 1',
    type: 'zabehnutaRodina',
    frameCount: 10,
    queenStatus: 'stara',
    queenColor: 'Žltá',
    colonyFoundingDate: '2024-02-15T10:00:00Z',
    createdAt: '2024-03-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Úľ č. 2',
    type: 'roj',
    frameCount: 8,
    queenStatus: 'nova',
    queenColor: 'Fialová',
    colonyFoundingDate: '2024-04-10T14:30:00Z',
    createdAt: '2024-04-15T14:30:00Z',
  },
];

export const sampleInspections: Inspection[] = [
  {
    id: '1',
    hiveId: '1',
    date: '2024-09-10T09:00:00Z',
    notes: 'Úľ je v dobrom stave, matka kladie vajíčka. Pridané nové rámiky.',
    createdAt: '2024-09-10T09:30:00Z',
  },
  {
    id: '2',
    hiveId: '1',
    date: '2024-09-05T16:00:00Z',
    notes: 'Kontrola po pridaní nových rámikov. Včely aktívne.',
    createdAt: '2024-09-05T16:15:00Z',
  },
  {
    id: '3',
    hiveId: '2',
    date: '2024-09-08T11:00:00Z',
    notes: 'Nový roj sa dobre zabieha. Matka začína klásť.',
    createdAt: '2024-09-08T11:20:00Z',
  },
];

export const sampleTasks: Task[] = [
  {
    id: '1',
    hiveId: '1',
    title: 'Kontrola matky',
    description: 'Skontrolovať či matka kladie vajíčka a či je zdravá',
    dueDate: '2024-09-20T10:00:00Z',
    completed: false,
    createdAt: '2024-09-15T08:00:00Z',
  },
  {
    id: '2',
    hiveId: '2',
    title: 'Pridať rámiky',
    description: 'Pridať 2 nové rámiky pre rozšírenie úľa',
    dueDate: '2024-09-18T14:00:00Z',
    completed: false,
    createdAt: '2024-09-15T10:00:00Z',
  },
  {
    id: '3',
    hiveId: '1',
    title: 'Ošetrenie proti roztoču',
    description: 'Aplikovať ošetrenie proti varroa roztoču',
    dueDate: '2024-09-12T09:00:00Z',
    completed: true,
    createdAt: '2024-09-10T15:00:00Z',
  },
];

export const sampleYields: Yield[] = [
  {
    id: '1',
    hiveId: '1',
    type: 'med',
    amount: 15.5,
    unit: 'kg',
    date: '2024-08-15T10:00:00Z',
    notes: 'Letný med, svetlá farba',
  },
  {
    id: '2',
    hiveId: '2',
    type: 'med',
    amount: 8.2,
    unit: 'kg',
    date: '2024-08-20T14:00:00Z',
    notes: 'Prvý med z nového roja',
  },
  {
    id: '3',
    hiveId: '1',
    type: 'pel',
    amount: 2.1,
    unit: 'kg',
    date: '2024-07-10T11:00:00Z',
    notes: 'Peľ z lúčnych kvetov',
  },
];