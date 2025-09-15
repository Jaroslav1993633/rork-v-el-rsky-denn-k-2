export interface Hive {
  id: string;
  name: string;
  type: 'odlozenec' | 'roj' | 'zabehnutaRodina' | 'kupeneVcelstvo' | 'ine';
  frameCount: number;
  queenStatus: 'stara' | 'nova' | 'vylahne';
  queenColor: string;
  colonyFoundingDate: string;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
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

export interface MonthlyStats {
  year: number;
  month: number;
  inspectionCount: number;
  yieldAmount: number;
}

export interface YearlyStats {
  year: number;
  totalInspections: number;
  totalYield: number;
  monthlyBreakdown: MonthlyStats[];
}

export interface AppState {
  hives: Hive[];
  inspections: Inspection[];
  tasks: Task[];
  yields: Yield[];
  monthlyStats: MonthlyStats[];
  yearlyStats: YearlyStats[];
  trialStartDate: string | null;
  isRegistered: boolean;
}