import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Hive, Inspection, Task, Yield, MonthlyStats, YearlyStats } from '@/types/beekeeping';
import { sampleHives, sampleInspections, sampleTasks, sampleYields } from '@/mocks/sample-data';

const STORAGE_KEY = 'beekeeping_data';
const TRIAL_DURATION = 10; // days

const initialState: AppState = {
  hives: [],
  inspections: [],
  tasks: [],
  yields: [],
  monthlyStats: [],
  yearlyStats: [],
  trialStartDate: null,
  isRegistered: false,
};

export const [BeekeepingProvider, useBeekeeping] = createContextHook(() => {
  const [state, setState] = useState<AppState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  const saveData = useCallback(async (data: AppState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setState(data);
      } else {
        // First time user - start trial with sample data
        const newState = {
          ...initialState,
          hives: sampleHives,
          inspections: sampleInspections,
          tasks: sampleTasks,
          yields: sampleYields,
          monthlyStats: [],
          yearlyStats: [],
          trialStartDate: new Date().toISOString(),
        };
        setState(newState);
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        } catch (saveError) {
          console.error('Error saving initial data:', saveError);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const updateState = useCallback((updates: Partial<AppState> | ((prevState: AppState) => Partial<AppState>)) => {
    setState(prevState => {
      const updatesObj = typeof updates === 'function' ? updates(prevState) : updates;
      const newState = { ...prevState, ...updatesObj };
      saveData(newState);
      return newState;
    });
  }, [saveData]);

  // Hive management
  const addHive = useCallback((hive: Omit<Hive, 'id' | 'createdAt'>) => {
    const newHive: Hive = {
      ...hive,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateState(prevState => ({ hives: [...(prevState.hives || []), newHive] }));
  }, [updateState]);

  const updateHive = useCallback((id: string, updates: Partial<Hive>) => {
    updateState(prevState => ({
      hives: (prevState.hives || []).map(hive =>
        hive.id === id ? { ...hive, ...updates } : hive
      )
    }));
  }, [updateState]);

  const deleteHive = useCallback((id: string) => {
    updateState(prevState => ({
      hives: (prevState.hives || []).map(hive =>
        hive.id === id 
          ? { ...hive, isDeleted: true, deletedAt: new Date().toISOString() }
          : hive
      ),
      tasks: (prevState.tasks || []).filter(task => task.hiveId !== id),
    }));
  }, [updateState]);

  // Inspection management
  const addInspection = useCallback((inspection: Omit<Inspection, 'id' | 'createdAt'>) => {
    const newInspection: Inspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateState(prevState => ({ inspections: [...(prevState.inspections || []), newInspection] }));
  }, [updateState]);

  const updateInspection = useCallback((id: string, updates: Partial<Inspection>) => {
    updateState(prevState => ({
      inspections: (prevState.inspections || []).map(inspection =>
        inspection.id === id ? { ...inspection, ...updates } : inspection
      )
    }));
  }, [updateState]);

  const deleteInspection = useCallback((id: string) => {
    updateState(prevState => ({
      inspections: (prevState.inspections || []).filter(inspection => inspection.id !== id)
    }));
  }, [updateState]);

  // Task management
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateState(prevState => ({ tasks: [...(prevState.tasks || []), newTask] }));
  }, [updateState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateState(prevState => ({
      tasks: (prevState.tasks || []).map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    }));
  }, [updateState]);

  const deleteTask = useCallback((id: string) => {
    updateState(prevState => ({
      tasks: (prevState.tasks || []).filter(task => task.id !== id)
    }));
  }, [updateState]);

  // Yield management
  const addYield = useCallback((yieldData: Omit<Yield, 'id'>) => {
    const newYield: Yield = {
      ...yieldData,
      id: Date.now().toString(),
    };
    updateState(prevState => ({ yields: [...(prevState.yields || []), newYield] }));
  }, [updateState]);

  const updateYield = useCallback((id: string, updates: Partial<Yield>) => {
    updateState(prevState => ({
      yields: (prevState.yields || []).map(yieldItem =>
        yieldItem.id === id ? { ...yieldItem, ...updates } : yieldItem
      )
    }));
  }, [updateState]);

  const deleteYield = useCallback((id: string) => {
    updateState(prevState => ({
      yields: (prevState.yields || []).filter(yieldItem => yieldItem.id !== id)
    }));
  }, [updateState]);

  // Trial and registration
  const getRemainingTrialDays = useCallback(() => {
    if (state.isRegistered || !state.trialStartDate) return null;
    
    const startDate = new Date(state.trialStartDate);
    const currentDate = new Date();
    const daysPassed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = TRIAL_DURATION - daysPassed;
    
    return Math.max(0, remainingDays);
  }, [state.isRegistered, state.trialStartDate]);

  const register = useCallback(() => {
    updateState({ isRegistered: true });
  }, [updateState]);

  // Statistics
  const getThisMonthInspections = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return (state.inspections || []).filter(inspection => {
      const inspectionDate = new Date(inspection.date);
      return inspectionDate.getMonth() === currentMonth && inspectionDate.getFullYear() === currentYear;
    }).length;
  }, [state.inspections]);

  const getThisYearYield = useCallback(() => {
    const currentYear = new Date().getFullYear();
    
    return (state.yields || [])
      .filter(yieldItem => new Date(yieldItem.date).getFullYear() === currentYear)
      .reduce((total, yieldItem) => total + yieldItem.amount, 0);
  }, [state.yields]);

  const getPendingTasks = useCallback(() => {
    return (state.tasks || []).filter(task => !task.completed && new Date(task.dueDate) >= new Date());
  }, [state.tasks]);

  // Statistics calculation and management
  const calculateMonthlyStats = useCallback((year: number, month: number): MonthlyStats => {
    const inspectionCount = (state.inspections || []).filter(inspection => {
      const date = new Date(inspection.date);
      return date.getFullYear() === year && date.getMonth() === month;
    }).length;

    const yieldAmount = (state.yields || [])
      .filter(yieldItem => {
        const date = new Date(yieldItem.date);
        return date.getFullYear() === year && date.getMonth() === month;
      })
      .reduce((total, yieldItem) => total + yieldItem.amount, 0);

    return {
      year,
      month,
      inspectionCount,
      yieldAmount,
    };
  }, [state.inspections, state.yields]);

  const updateMonthlyStats = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const existingStatIndex = (state.monthlyStats || []).findIndex(
      stat => stat.year === currentYear && stat.month === currentMonth
    );
    
    const newMonthlyStats = calculateMonthlyStats(currentYear, currentMonth);
    
    let updatedMonthlyStats: MonthlyStats[];
    if (existingStatIndex >= 0) {
      updatedMonthlyStats = [...(state.monthlyStats || [])];
      updatedMonthlyStats[existingStatIndex] = newMonthlyStats;
    } else {
      updatedMonthlyStats = [...(state.monthlyStats || []), newMonthlyStats];
    }
    
    updateState({ monthlyStats: updatedMonthlyStats });
  }, [state.monthlyStats, calculateMonthlyStats, updateState]);

  const updateYearlyStats = useCallback(() => {
    const currentYear = new Date().getFullYear();
    
    const yearInspections = (state.inspections || []).filter(inspection => 
      new Date(inspection.date).getFullYear() === currentYear
    ).length;
    
    const yearYield = (state.yields || [])
      .filter(yieldItem => new Date(yieldItem.date).getFullYear() === currentYear)
      .reduce((total, yieldItem) => total + yieldItem.amount, 0);
    
    const monthlyBreakdown: MonthlyStats[] = [];
    for (let month = 0; month < 12; month++) {
      monthlyBreakdown.push(calculateMonthlyStats(currentYear, month));
    }
    
    const newYearlyStats: YearlyStats = {
      year: currentYear,
      totalInspections: yearInspections,
      totalYield: yearYield,
      monthlyBreakdown,
    };
    
    const existingYearIndex = (state.yearlyStats || []).findIndex(
      stat => stat.year === currentYear
    );
    
    let updatedYearlyStats: YearlyStats[];
    if (existingYearIndex >= 0) {
      updatedYearlyStats = [...(state.yearlyStats || [])];
      updatedYearlyStats[existingYearIndex] = newYearlyStats;
    } else {
      updatedYearlyStats = [...(state.yearlyStats || []), newYearlyStats];
    }
    
    updateState({ yearlyStats: updatedYearlyStats });
  }, [state.inspections, state.yields, state.yearlyStats, calculateMonthlyStats, updateState]);

  const resetMonthlyStats = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const resetStats: MonthlyStats = {
      year: currentYear,
      month: currentMonth,
      inspectionCount: 0,
      yieldAmount: 0,
    };
    
    const existingStatIndex = (state.monthlyStats || []).findIndex(
      stat => stat.year === currentYear && stat.month === currentMonth
    );
    
    let updatedMonthlyStats: MonthlyStats[];
    if (existingStatIndex >= 0) {
      updatedMonthlyStats = [...(state.monthlyStats || [])];
      updatedMonthlyStats[existingStatIndex] = resetStats;
    } else {
      updatedMonthlyStats = [...(state.monthlyStats || []), resetStats];
    }
    
    updateState({ monthlyStats: updatedMonthlyStats });
  }, [state.monthlyStats, updateState]);

  const resetYearlyStats = useCallback(() => {
    const currentYear = new Date().getFullYear();
    
    const resetStats: YearlyStats = {
      year: currentYear,
      totalInspections: 0,
      totalYield: 0,
      monthlyBreakdown: Array.from({ length: 12 }, (_, month) => ({
        year: currentYear,
        month,
        inspectionCount: 0,
        yieldAmount: 0,
      })),
    };
    
    const existingYearIndex = (state.yearlyStats || []).findIndex(
      stat => stat.year === currentYear
    );
    
    let updatedYearlyStats: YearlyStats[];
    if (existingYearIndex >= 0) {
      updatedYearlyStats = [...(state.yearlyStats || [])];
      updatedYearlyStats[existingYearIndex] = resetStats;
    } else {
      updatedYearlyStats = [...(state.yearlyStats || []), resetStats];
    }
    
    updateState({ yearlyStats: updatedYearlyStats });
  }, [state.yearlyStats, updateState]);

  const getHistoricalStats = useCallback((year?: number, month?: number) => {
    if (year && month !== undefined) {
      return (state.monthlyStats || []).find(stat => stat.year === year && stat.month === month);
    }
    if (year) {
      return (state.yearlyStats || []).find(stat => stat.year === year);
    }
    return {
      monthlyStats: state.monthlyStats || [],
      yearlyStats: state.yearlyStats || [],
    };
  }, [state.monthlyStats, state.yearlyStats]);



  return useMemo(() => ({
    ...state,
    isLoading,
    
    // Hive methods
    addHive,
    updateHive,
    deleteHive,
    
    // Inspection methods
    addInspection,
    updateInspection,
    deleteInspection,
    
    // Task methods
    addTask,
    updateTask,
    deleteTask,
    
    // Yield methods
    addYield,
    updateYield,
    deleteYield,
    
    // Trial and registration
    getRemainingTrialDays,
    register,
    
    // Statistics
    getThisMonthInspections,
    getThisYearYield,
    getPendingTasks,
    
    // Advanced statistics
    calculateMonthlyStats,
    updateMonthlyStats,
    updateYearlyStats,
    resetMonthlyStats,
    resetYearlyStats,
    getHistoricalStats,
  }), [
    state,
    isLoading,
    addHive,
    updateHive,
    deleteHive,
    addInspection,
    updateInspection,
    deleteInspection,
    addTask,
    updateTask,
    deleteTask,
    addYield,
    updateYield,
    deleteYield,
    getRemainingTrialDays,
    register,
    getThisMonthInspections,
    getThisYearYield,
    getPendingTasks,
    calculateMonthlyStats,
    updateMonthlyStats,
    updateYearlyStats,
    resetMonthlyStats,
    resetYearlyStats,
    getHistoricalStats,
  ]);
});