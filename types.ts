
export interface MacroGoal {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  grams?: number;
  mealType: MealType;
  image?: string; // Base64 Data URL
}

export interface FoodLog {
  id: string;
  date: string;
  items: FoodItem[];
}

export interface ExerciseSet {
  id: string;
  reps: number;
  weight: number;
  isPR?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  color?: string;
}

export interface UserProfile {
  name: string;
  targetWeight: number;
  targetDate: string; // YYYY-MM-DD
}

export interface AppState {
  userProfile: UserProfile;
  userGoals: MacroGoal;
  weightHistory: WeightEntry[];
  foodLogs: Record<string, FoodLog>; // Key is YYYY-MM-DD
  workoutLogs: Record<string, WorkoutLog>; // Key is YYYY-MM-DD
  selectedDate: string; // YYYY-MM-DD
}

export enum Tab {
  HOME = 'Home',
  WORKOUT = 'Workout',
  NUTRITION = 'Nutrition',
  STATISTICS = 'Statistics'
}
