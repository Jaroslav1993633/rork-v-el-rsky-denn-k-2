export interface Hive {
  id: string;
  name: string;
  type: 'odlozenec' | 'roj' | 'zabehnutaRodina' | 'kupeneVcelstvo' | 'ine';
  frameCount: number;
  queenStatus: 'stara' | 'nova' | 'vylahne';
  queenColor: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  hiveId: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Task {
  id: string;
  hiveId: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface Yield {
  id: string;
  hiveId: string;
  type: 'med' | 'pel' | 'propolis' | 'ine';
  amount: number;
  unit: string;
  date: string;
  notes?: string;
}

export interface AppState {
  hives: Hive[];
  inspections: Inspection[];
  tasks: Task[];
  yields: Yield[];
  trialStartDate: string | null;
  isRegistered: boolean;
}