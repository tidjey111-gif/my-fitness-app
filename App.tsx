
import React, { useState, createContext, useContext, useEffect, ReactNode, useMemo } from 'react';
import { Home, Dumbbell, Utensils, BarChart3 } from 'lucide-react';
import { Tab, AppState, MacroGoal, WeightEntry, FoodLog, WorkoutLog, UserProfile, FoodItem, MealType } from './types';
import HomePage from './pages/Home';
import WorkoutPage from './pages/Workout';
import NutritionPage from './pages/Nutrition';
import StatisticsPage from './pages/Statistics';

// --- Context ---
interface AppContextType extends AppState {
  setTab: (tab: Tab) => void;
  currentTab: Tab;
  setDate: (date: string) => void;
  addWeightEntry: (date: string, weight: number) => void;
  addFoodItem: (date: string, item: FoodItem) => void;
  editFoodItem: (date: string, item: FoodItem) => void;
  deleteFoodItem: (date: string, itemId: string) => void;
  copyMealGroup: (sourceDate: string, targetDate: string, mealType: MealType) => void;
  updateWorkout: (date: string, workout: WorkoutLog) => void;
  deleteWorkoutDay: (date: string) => void;
  prDays: Set<string>;
  updateUserProfile: (profile: UserProfile) => void;
  updateUserGoals: (goals: MacroGoal) => void;
  updateFoodLog: (date: string, log: FoodLog) => void;
  importData: (data: AppState) => void;
  getAllData: () => AppState;
  updateApiKey: (key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- Helper: Calculate PR Days ---
const calculatePRDays = (logs: Record<string, WorkoutLog>): Set<string> => {
    const sortedDates = Object.keys(logs).sort((a, b) => a.localeCompare(b));
    const prDays = new Set<string>();
    const stats: Record<string, { maxWeight: number; repsByWeight: Record<number, number> }> = {};

    for (const date of sortedDates) {
        const log = logs[date];
        let dayHasPR = false;

        for (const ex of log.exercises) {
            const name = ex.name.trim().toLowerCase();
            if (!stats[name]) stats[name] = { maxWeight: 0, repsByWeight: {} };

            for (const set of ex.sets) {
                let isPR = false;
                // Check Weight PR
                if (set.weight > stats[name].maxWeight) {
                    isPR = true;
                }
                // Check Rep PR only if weight history exists.
                else if (stats[name].repsByWeight[set.weight] !== undefined) {
                    if (set.reps > stats[name].repsByWeight[set.weight]) {
                        isPR = true;
                    }
                }

                if (isPR) {
                    dayHasPR = true;
                }

                // Update Stats after checking
                if (set.weight > stats[name].maxWeight) {
                    stats[name].maxWeight = set.weight;
                }
                const currentMaxReps = stats[name].repsByWeight[set.weight] || 0;
                if (set.reps > currentMaxReps) {
                    stats[name].repsByWeight[set.weight] = set.reps;
                }
            }
        }
        if (dayHasPR) prDays.add(date);
    }
    return prDays;
};

// --- Helper: Get Local Date ISO String ---
const getLocalToday = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

// --- Initial State ---
const INITIAL_STATE: AppState = {
  userProfile: {
    name: 'Атлет',
    targetWeight: 80,
    targetDate: '2024-12-31',
  },
  userGoals: { calories: 2500, protein: 180, fat: 80, carbs: 265 },
  weightHistory: [], 
  foodLogs: {},
  workoutLogs: {},
  selectedDate: getLocalToday(),
};

const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.HOME);

  const prDays = useMemo(() => calculatePRDays(state.workoutLogs), [state.workoutLogs]);

  useEffect(() => {
    const today = getLocalToday();
    setState(prev => ({ ...prev, selectedDate: today }));
  }, []);

  const setDate = (date: string) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const addWeightEntry = (date: string, weight: number) => {
    setState(prev => {
      const newHistory = [...prev.weightHistory.filter(w => w.date !== date), { date, weight }];
      return { ...prev, weightHistory: newHistory.sort((a, b) => a.date.localeCompare(b.date)) };
    });
  };

  const addFoodItem = (date: string, item: FoodItem) => {
    setState(prev => {
      const log = prev.foodLogs[date] || { id: Math.random().toString(), date, items: [] };
      const newItems = [...log.items, { ...item, id: Math.random().toString() }];
      return {
        ...prev,
        foodLogs: { ...prev.foodLogs, [date]: { ...log, items: newItems } }
      };
    });
  };

  const editFoodItem = (date: string, updatedItem: FoodItem) => {
    setState(prev => {
      const log = prev.foodLogs[date];
      if (!log) return prev;
      const newItems = log.items.map(item => item.id === updatedItem.id ? updatedItem : item);
      return {
        ...prev,
        foodLogs: { ...prev.foodLogs, [date]: { ...log, items: newItems } }
      };
    });
  };

  const deleteFoodItem = (date: string, itemId: string) => {
    setState(prev => {
      const log = prev.foodLogs[date];
      if (!log) return prev;
      const newItems = log.items.filter(item => item.id !== itemId);
      return {
        ...prev,
        foodLogs: { ...prev.foodLogs, [date]: { ...log, items: newItems } }
      };
    });
  };

  const copyMealGroup = (sourceDate: string, targetDate: string, mealType: MealType) => {
    setState(prev => {
      const sourceLog = prev.foodLogs[sourceDate];
      if (!sourceLog) return prev;

      const itemsToCopy = sourceLog.items.filter(item => item.mealType === mealType);
      if (itemsToCopy.length === 0) return prev;

      const targetLog = prev.foodLogs[targetDate] || { id: Math.random().toString(), date: targetDate, items: [] };
      
      const newItems = itemsToCopy.map(item => ({
        ...item,
        id: Math.random().toString()
      }));

      return {
        ...prev,
        foodLogs: {
           ...prev.foodLogs,
           [targetDate]: {
              ...targetLog,
              items: [...targetLog.items, ...newItems]
           }
        }
      };
    });
  };

  const updateFoodLog = (date: string, log: FoodLog) => {
    setState(prev => ({
        ...prev,
        foodLogs: { ...prev.foodLogs, [date]: log }
    }));
  };

  const updateWorkout = (date: string, workout: WorkoutLog) => {
    setState(prev => ({
      ...prev,
      workoutLogs: { ...prev.workoutLogs, [date]: workout }
    }));
  };

  const deleteWorkoutDay = (date: string) => {
    setState(prev => {
        const newLogs = { ...prev.workoutLogs };
        delete newLogs[date];
        return { ...prev, workoutLogs: newLogs };
    });
  };

  const updateUserProfile = (profile: UserProfile) => {
    setState(prev => ({ ...prev, userProfile: profile }));
  };

  const updateUserGoals = (goals: MacroGoal) => {
    setState(prev => ({ ...prev, userGoals: goals }));
  };

  const importData = (data: AppState) => {
      setState(data);
  };

  const getAllData = () => {
      return state;
  };

  const updateApiKey = (key: string) => {
      localStorage.setItem('gemini_api_key', key);
      // Simple reload to ensure services pick up the new key from storage
      window.location.reload();
  };

  return (
    <AppContext.Provider value={{
      ...state,
      setTab: setCurrentTab,
      currentTab,
      setDate,
      addWeightEntry,
      addFoodItem,
      editFoodItem,
      deleteFoodItem,
      copyMealGroup,
      updateFoodLog,
      updateWorkout,
      deleteWorkoutDay,
      prDays,
      updateUserProfile,
      updateUserGoals,
      importData,
      getAllData,
      updateApiKey
    }}>
      {children}
    </AppContext.Provider>
  );
};

// --- Main Layout ---
const Layout: React.FC = () => {
  const { currentTab, setTab } = useApp();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        {currentTab === Tab.HOME && <HomePage />}
        {currentTab === Tab.WORKOUT && <WorkoutPage />}
        {currentTab === Tab.NUTRITION && <NutritionPage />}
        {currentTab === Tab.STATISTICS && <StatisticsPage />}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 pb-safe safe-area-inset-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <NavButton tab={Tab.HOME} current={currentTab} setTab={setTab} icon={<Home size={24} />} label="Главная" />
          <NavButton tab={Tab.WORKOUT} current={currentTab} setTab={setTab} icon={<Dumbbell size={24} />} label="Тренировка" />
          <NavButton tab={Tab.NUTRITION} current={currentTab} setTab={setTab} icon={<Utensils size={24} />} label="Питание" />
          <NavButton tab={Tab.STATISTICS} current={currentTab} setTab={setTab} icon={<BarChart3 size={24} />} label="Статистика" />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ tab, current, setTab, icon, label }: { tab: Tab, current: Tab, setTab: (t: Tab) => void, icon: ReactNode, label: string }) => {
  const isActive = current === tab;
  return (
    <button
      onClick={() => setTab(tab)}
      className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
    >
      <div className={`transform transition-transform duration-300 ${isActive ? '-translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium mt-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </span>
    </button>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
};

export default App;
