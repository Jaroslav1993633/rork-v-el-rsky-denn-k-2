import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppState, Hive, Inspection, Task, Yield } from '@/types/beekeeping';
import { sampleHives, sampleInspections, sampleTasks, sampleYields } from '@/mocks/sample-data';

const STORAGE_KEY = 'beekeeping_data';
const TRIAL_DURATION = 10; // days

const initialState: AppState = {
  hives: [],
  inspections: [],
  tasks: [],
  yields: [],
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
          trialStartDate: new Date().toISOString(),
        };
        setState(newState);
        await saveData(newState);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [saveData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    updateState(prevState => ({ hives: [...prevState.hives, newHive] }));
  }, [updateState]);

  const updateHive = useCallback((id: string, updates: Partial<Hive>) => {
    updateState(prevState => ({
      hives: prevState.hives.map(hive =>
        hive.id === id ? { ...hive, ...updates } : hive
      )
    }));
  }, [updateState]);

  const deleteHive = useCallback((id: string) => {
    updateState(prevState => ({
      hives: prevState.hives.filter(hive => hive.id !== id),
      inspections: prevState.inspections.filter(inspection => inspection.hiveId !== id),
      tasks: prevState.tasks.filter(task => task.hiveId !== id),
      yields: prevState.yields.filter(yieldItem => yieldItem.hiveId !== id),
    }));
  }, [updateState]);

  // Inspection management
  const addInspection = useCallback((inspection: Omit<Inspection, 'id' | 'createdAt'>) => {
    const newInspection: Inspection = {
      ...inspection,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateState(prevState => ({ inspections: [...prevState.inspections, newInspection] }));
  }, [updateState]);

  const updateInspection = useCallback((id: string, updates: Partial<Inspection>) => {
    updateState(prevState => ({
      inspections: prevState.inspections.map(inspection =>
        inspection.id === id ? { ...inspection, ...updates } : inspection
      )
    }));
  }, [updateState]);

  const deleteInspection = useCallback((id: string) => {
    updateState(prevState => ({
      inspections: prevState.inspections.filter(inspection => inspection.id !== id)
    }));
  }, [updateState]);

  // Task management
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    updateState(prevState => ({ tasks: [...prevState.tasks, newTask] }));
  }, [updateState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    updateState(prevState => ({
      tasks: prevState.tasks.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    }));
  }, [updateState]);

  const deleteTask = useCallback((id: string) => {
    updateState(prevState => ({
      tasks: prevState.tasks.filter(task => task.id !== id)
    }));
  }, [updateState]);

  // Yield management
  const addYield = useCallback((yieldData: Omit<Yield, 'id'>) => {
    const newYield: Yield = {
      ...yieldData,
      id: Date.now().toString(),
    };
    updateState(prevState => ({ yields: [...prevState.yields, newYield] }));
  }, [updateState]);

  const updateYield = useCallback((id: string, updates: Partial<Yield>) => {
    updateState(prevState => ({
      yields: prevState.yields.map(yieldItem =>
        yieldItem.id === id ? { ...yieldItem, ...updates } : yieldItem
      )
    }));
  }, [updateState]);

  const deleteYield = useCallback((id: string) => {
    updateState(prevState => ({
      yields: prevState.yields.filter(yieldItem => yieldItem.id !== id)
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
    
    return state.inspections.filter(inspection => {
      const inspectionDate = new Date(inspection.date);
      return inspectionDate.getMonth() === currentMonth && inspectionDate.getFullYear() === currentYear;
    }).length;
  }, [state.inspections]);

  const getThisYearYield = useCallback(() => {
    const currentYear = new Date().getFullYear();
    
    return state.yields
      .filter(yieldItem => new Date(yieldItem.date).getFullYear() === currentYear)
      .reduce((total, yieldItem) => total + yieldItem.amount, 0);
  }, [state.yields]);

  const getPendingTasks = useCallback(() => {
    return state.tasks.filter(task => !task.completed && new Date(task.dueDate) >= new Date());
  }, [state.tasks]);

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
  ]);
});