
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';
import { Activity, Flame, Trophy, Plus, ChevronRight, Settings, Target, Award, X, Download, Upload, Flag, RotateCcw } from 'lucide-react';
import { Tab, UserProfile, MacroGoal, AppState } from '../types';

// --- Sub-components ---

const CustomWeightTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const dateParts = data.date.split('-');
    const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0].slice(2)}`;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-sm shadow-2xl">
        <p className="text-slate-400 text-xs mb-1">{formattedDate}</p>
        <p className="text-white font-bold text-lg">{`${data.weight} кг`}</p>
      </div>
    );
  }
  return null;
};

const GoalReachedModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
             <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="confetti"
                        style={{
                            left: `${Math.random() * 100}vw`,
                            animationDelay: `${Math.random() * 2}s`,
                            animationDuration: `${3 + Math.random() * 4}s`,
                            transform: `scale(${0.5 + Math.random()})`,
                        }}
                    ></div>
                ))}
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/50 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scaleIn text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"><X/></button>
                <Award size={64} className="text-yellow-400 mx-auto animate-bounce" />
                <h2 className="text-2xl font-bold mt-4 text-white">Поздравляю!</h2>
                <p className="text-slate-300 mt-2">Ты достиг цели, дальше больше!!!</p>
            </div>
        </div>
    );
};


const SettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  goals: MacroGoal;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveGoals: (goals: MacroGoal) => void;
  onExport: () => AppState;
  onImport: (data: AppState) => void;
}> = ({ isOpen, onClose, profile, goals, onSaveProfile, onSaveGoals, onExport, onImport }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [localGoals, setLocalGoals] = useState<MacroGoal>(goals);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        setLocalProfile(profile);
        setLocalGoals(goals);
    }
  }, [isOpen, profile, goals]);


  const handleSave = () => {
    onSaveProfile(localProfile);
    onSaveGoals(localGoals);
    onClose();
  };

  const handleExportData = () => {
      const data = onExport();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `fitflow_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = event.target?.result as string;
              const data = JSON.parse(json);
              if (data && data.userProfile && data.foodLogs) {
                  onImport(data);
                  alert('База данных успешно восстановлена!');
                  onClose();
              } else {
                  alert('Ошибка: Неверный формат файла.');
              }
          } catch (err) {
              alert('Ошибка при чтении файла.');
              console.error(err);
          }
      };
      reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-white">Настройки профиля</h3>
        <div className="space-y-5">
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Ваше имя</label>
            <input
              type="text"
              value={localProfile.name}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
              className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Дневная цель ккал</label>
            <input
              type="number"
              value={localGoals.calories}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setLocalGoals({ ...localGoals, calories: parseInt(e.target.value, 10) || 0 })}
              className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Целевой вес (кг)</label>
            <input
              type="number"
              value={localProfile.targetWeight}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setLocalProfile({ ...localProfile, targetWeight: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Целевая дата</label>
            <input
              type="date"
              value={localProfile.targetDate}
              onChange={(e) => setLocalProfile({ ...localProfile, targetDate: e.target.value })}
              className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
            />
          </div>
          
          <div className="pt-4 border-t border-slate-700/50">
              <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1 mb-2 block">Резервное копирование</label>
              <div className="flex gap-3">
                  <button onClick={handleExportData} className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm text-slate-300">
                      <Download size={16} /> Экспорт
                  </button>
                  <button onClick={handleImportClick} className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center justify-center gap-2 text-sm text-slate-300">
                      <Upload size={16} /> Импорт
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/json" />
              </div>
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors">Отмена</button>
          <button onClick={handleSave} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">Сохранить</button>
        </div>
      </div>
    </div>
  );
};

const WeightGoalProgress: React.FC<{
    progressData: { progress: number; isComplete: boolean; startWeight: number };
    daysRemainingData: { days: number; noun: string; };
    onReset: () => void;
}> = ({ progressData, daysRemainingData, onReset }) => {
    const { userProfile } = useApp();
    
    // Determine if we are losing or gaining weight
    const isLosing = progressData.startWeight > userProfile.targetWeight;
    
    return (
        <div 
            className="border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden bg-cover bg-center"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop")' 
            }}
        >
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-3 relative z-10">
                <div className="p-2 bg-cyan-500/10 rounded-xl backdrop-blur-md border border-cyan-500/20">
                    <Target className="text-cyan-400" size={20} /> 
                </div>
                Путь к цели
            </h2>
            
            {/* Legend Labels */}
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium uppercase tracking-wide mb-1 relative z-10">
                <span>Начало: {progressData.startWeight}</span>
                <span>Цель: {userProfile.targetWeight}</span>
            </div>

            <div className="relative h-20 w-full flex items-center z-10">
                {/* Track */}
                <div className="h-2 w-full bg-slate-700/50 rounded-full backdrop-blur-sm"></div>
                
                {/* Progress Fill */}
                <div 
                    className="absolute h-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full opacity-50"
                    style={{ width: `${progressData.progress}%`, left: 0 }}
                ></div>

                {/* Runner */}
                <div 
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 z-10"
                    style={{ left: `calc(${progressData.progress}% - 24px)`}}
                >
                    {progressData.isComplete ? (
                        <div className="flex flex-col items-center animate-bounce">
                           <Award size={48} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" fill="currentColor"/>
                        </div>
                    ) : (
                         // transform scale-x-[-1] flips the runner to face right
                         <div className="text-4xl running-man drop-shadow-md transform scale-x-[-1]">🏃‍♂️</div>
                    )}
                </div>
                
                {/* Finish Line / Trophy */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                   <div className={`
                       w-14 h-14 rounded-full border-4 flex items-center justify-center transition-colors duration-500 shadow-lg backdrop-blur-md
                       ${progressData.isComplete ? 'bg-emerald-500/20 border-emerald-500 shadow-emerald-500/20' : 'bg-slate-800/80 border-slate-600'}
                   `}>
                       <Trophy size={20} className={`${progressData.isComplete ? 'text-emerald-400' : 'text-slate-400'}`} />
                   </div>
                </div>
                
                {/* Start Flag */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                </div>
            </div>
            
            <div className="flex justify-between items-center mt-2 px-1 relative z-10">
                <div className="text-xs text-slate-400">
                    {isLosing ? 'Похудение' : 'Набор массы'}
                </div>
                <div className="text-xs text-slate-300">
                    {progressData.isComplete 
                        ? (
                            <div className="flex items-center gap-3">
                                <span className="text-emerald-400 font-bold hidden sm:inline">Цель достигнута!</span>
                                <button 
                                    onClick={onReset}
                                    className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-all flex items-center gap-1.5 animate-pulse"
                                >
                                    <RotateCcw size={12} />
                                    Новая цель
                                </button>
                            </div>
                        )
                        : <span>Осталось: <span className="text-white font-bold">{daysRemainingData.days}</span> {daysRemainingData.noun}</span>
                    }
                </div>
                <div className="text-xs text-slate-400">
                    {Math.round(progressData.progress)}%
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

const HomePage: React.FC = () => {
  const { userProfile, updateUserProfile, userGoals, updateUserGoals, foodLogs, weightHistory, workoutLogs, selectedDate, addWeightEntry, setTab, setDate, prDays, importData, getAllData } = useApp();
  
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalWeight, setModalWeight] = useState('');
  const [hasShownGoalModal, setHasShownGoalModal] = useState(false);

  useEffect(() => {
    // Sync modal date with global selected date when opened
    setModalDate(selectedDate);
  }, [isWeightModalOpen, selectedDate]);


  // Progress Calcs
  const progressData = useMemo(() => {
    // If no history, we are at 0%
    if (weightHistory.length < 1) {
        return { progress: 0, isComplete: false, startWeight: userProfile.targetWeight };
    }

    const startWeight = weightHistory[0].weight;
    const currentWeight = weightHistory[weightHistory.length - 1].weight;
    const targetWeight = userProfile.targetWeight;
    
    // Total distance to cover (absolute value)
    const totalDistance = Math.abs(targetWeight - startWeight);
    
    // Distance covered so far (absolute value)
    const distanceCovered = Math.abs(currentWeight - startWeight);
    
    // Check if we are moving in the WRONG direction
    // If goal is lose (Target < Start) but Current > Start -> Progress is 0
    // If goal is gain (Target > Start) but Current < Start -> Progress is 0
    let isMovingCorrectly = true;
    if (targetWeight < startWeight && currentWeight > startWeight) isMovingCorrectly = false;
    if (targetWeight > startWeight && currentWeight < startWeight) isMovingCorrectly = false;

    // Check if complete
    // If goal is lose: Current <= Target
    // If goal is gain: Current >= Target
    let isComplete = false;
    if (targetWeight < startWeight && currentWeight <= targetWeight) isComplete = true;
    if (targetWeight > startWeight && currentWeight >= targetWeight) isComplete = true;

    if (totalDistance === 0) {
        return { progress: 100, isComplete: true, startWeight };
    }

    let progress = 0;
    if (isComplete) {
        progress = 100;
    } else if (isMovingCorrectly) {
        progress = (distanceCovered / totalDistance) * 100;
    } else {
        progress = 0; // Moving away from goal
    }
    
    // Clamp
    progress = Math.max(0, Math.min(100, progress));

    return { progress, isComplete, startWeight };
  }, [weightHistory, userProfile]);

  const prevProgressRef = useRef(progressData.progress);
  useEffect(() => {
      if (progressData.progress >= 100 && prevProgressRef.current < 100 && !hasShownGoalModal) {
          setHasShownGoalModal(true);
      }
      prevProgressRef.current = progressData.progress;
  }, [progressData.progress, hasShownGoalModal]);
  
  const daysRemainingData = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const targetDate = new Date(userProfile.targetDate);
    targetDate.setUTCHours(0, 0, 0, 0);

    if (targetDate < today) return { days: 0, noun: 'дней' };
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const getDaysNoun = (number: number): string => {
        let n = Math.abs(number) % 100;
        let n1 = n % 10;
        if (n > 10 && n < 20) return 'дней';
        if (n1 > 1 && n1 < 5) return 'дня';
        if (n1 === 1) return 'день';
        return 'дней';
    };

    return { days: diffDays, noun: getDaysNoun(diffDays) };
  }, [userProfile.targetDate]);


  // Nutrition Calcs
  const todaysLog = foodLogs[selectedDate];
  const consumed = todaysLog ? todaysLog.items.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    fat: acc.fat + item.fat,
    carbs: acc.carbs + item.carbs,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 }) : { calories: 0, protein: 0, fat: 0, carbs: 0 };

  // Chart Data
  const macroData = [
    { name: 'Белки', value: consumed.protein, color: '#34d399' },
    { name: 'Жиры', value: consumed.fat, color: '#facc15' },
    { name: 'Углеводы', value: consumed.carbs, color: '#60a5fa' },
  ];

  const weightData = weightHistory.slice(-10).map(w => ({ date: w.date, weight: w.weight }));
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0;

  const handleSaveWeight = () => {
    if (modalWeight && modalDate) {
        addWeightEntry(modalDate, parseFloat(modalWeight));
        setIsWeightModalOpen(false);
        setModalWeight('');
    }
  };

  const todaysWorkout = workoutLogs[selectedDate];

  const getCalendarGrid = () => {
    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Calculate based on local time to match date display
    const firstDayRaw = new Date(year, month, 1).getDay(); // 0=Sun
    const firstDayOffset = (firstDayRaw + 6) % 7; // Adjust so Monday is 0

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < firstDayOffset; i++) {
        grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        grid.push(i);
    }
    return grid;
  };
  
  const calendarGrid = getCalendarGrid();
  const currentDisplayDate = new Date(selectedDate);

  return (
    <div className="relative min-h-screen">
       {/* Full Page Background */}
        <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.95)), url("https://images.unsplash.com/photo-1486218119243-13883505764c?q=80&w=2072&auto=format&fit=crop")',
                zIndex: -1
            }}
        ></div>

    <div className="p-4 space-y-6 pb-24 relative z-10">
      <GoalReachedModal isOpen={hasShownGoalModal} onClose={() => setHasShownGoalModal(false)} />
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pt-2">
        <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Привет, {userProfile.name}
            </h1>
            <p className="text-slate-400 text-sm">{new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="h-11 w-11 rounded-xl bg-slate-800/80 flex items-center justify-center border border-slate-700/50 hover:bg-slate-700 transition-colors shadow-lg">
            <Settings size={20} className="text-slate-300" />
        </button>
      </header>

      {/* Nutrition Summary Card - Modern Style with Background */}
      <div 
        className="border border-white/5 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden shadow-xl bg-cover bg-center"
        style={{ 
            backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.8)), url("https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop")' 
        }}
      >
        <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
            <Flame size={150} />
        </div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-orange-500/10 rounded-xl backdrop-blur-md border border-orange-500/20">
                <Flame className="text-orange-500" size={20} /> 
            </div>
            Дневная норма
        </h2>

        <div className="mb-6 relative z-10">
            <div className="flex justify-between items-center text-xs text-slate-400 mb-2 font-medium tracking-wide">
                <span>ПОТРЕБЛЕНО ККАЛ</span>
                <span className="text-white text-sm">{consumed.calories} <span className="text-slate-500">/ {userGoals.calories}</span></span>
            </div>
            <div className="h-3 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(249,115,22,0.4)]"
                    style={{ width: `${userGoals.calories > 0 ? Math.min(100, (consumed.calories / userGoals.calories) * 100) : 0}%` }}
                ></div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between relative z-10">
            <div className="w-32 h-32 sm:w-36 sm:h-36 relative shrink-0 mb-6 sm:mb-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={macroData.every(d => d.value === 0) ? [{value: 1}] : macroData}
                            innerRadius={42}
                            outerRadius={58}
                            paddingAngle={6}
                            dataKey="value"
                            stroke="none"
                            cornerRadius={6}
                        >
                            {macroData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            {macroData.every(d => d.value === 0) && <Cell fill="rgba(30, 41, 59, 0.5)" />}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-2xl font-bold text-white">{consumed.calories}</span>
                     <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">ккал</span>
                </div>
            </div>
            
            <div className="flex-1 w-full sm:ml-8 space-y-4">
                <MacroProgress label="Белки" current={consumed.protein} total={userGoals.protein} color="bg-emerald-400" />
                <MacroProgress label="Углеводы" current={consumed.carbs} total={userGoals.carbs} color="bg-blue-400" />
                <MacroProgress label="Жиры" current={consumed.fat} total={userGoals.fat} color="bg-yellow-400" />
            </div>
        </div>
      </div>

      {/* Weight Tracker - Modern Style with Measuring Tape Background */}
      <div 
        className="border border-white/5 rounded-3xl p-6 backdrop-blur-sm shadow-xl bg-cover bg-center"
        style={{ 
            backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop")' 
        }}
      >
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-lg font-semibold flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl backdrop-blur-md border border-purple-500/20">
                    <Activity className="text-purple-500" size={20} /> 
                </div>
                Трекер веса
            </h2>
            <div className="flex items-center gap-3">
                <span className="font-mono text-sm bg-slate-950/50 text-slate-200 px-4 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-sm">{currentWeight > 0 ? `${currentWeight} кг` : '-'}</span>
                <button onClick={() => setIsWeightModalOpen(true)} className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 text-white">
                    <Plus size={18} />
                </button>
            </div>
        </div>
        <div className="h-40 w-full -ml-2 relative z-10">
          {weightHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                    <Tooltip 
                      content={<CustomWeightTooltip />}
                      cursor={{ stroke: '#a78bfa', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#a78bfa" 
                        strokeWidth={3} 
                        dot={{r: 4, fill:'#a78bfa', strokeWidth: 2, stroke:'#1e293b'}} 
                        activeDot={{ r: 6, fill: '#fff' }} 
                    />
                </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Добавьте первую запись, чтобы увидеть график.
             </div>
          )}
        </div>
      </div>
      
      {/* Weight Goal Progress - Modern Style applied in component */}
      <WeightGoalProgress 
        progressData={progressData} 
        daysRemainingData={daysRemainingData} 
        onReset={() => setIsSettingsOpen(true)}
      />

      {/* Today's Workout - Modern & Detailed Style with Gym Background */}
      <div 
        className="border border-white/5 rounded-3xl p-6 backdrop-blur-sm relative overflow-hidden shadow-xl group h-auto min-h-[160px] bg-cover bg-center cursor-pointer" 
        onClick={() => setTab(Tab.WORKOUT)}
        style={{ 
            backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop")' 
        }}
      >
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl backdrop-blur-md border border-emerald-500/20">
                        <Trophy className="text-emerald-500" size={20} /> 
                    </div>
                    Сегодняшняя тренировка
                </h2>
                <p className="text-slate-400 text-sm ml-11">
                    {todaysWorkout ? todaysWorkout.name : "День отдыха или не запланировано"}
                </p>
             </div>
             <button className="p-2 bg-slate-800/50 rounded-xl text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-all backdrop-blur-md">
                 <ChevronRight size={20} />
             </button>
          </div>
          
          <div className="mt-2 space-y-3 relative z-10">
              {todaysWorkout && todaysWorkout.exercises.length > 0 ? (
                  todaysWorkout.exercises.map((ex, i) => (
                      <div key={i} className="bg-slate-950/40 rounded-xl p-3 border border-white/5 backdrop-blur-sm hover:bg-slate-950/60 transition-colors">
                          <div className="text-sm font-bold text-emerald-400 mb-1">{ex.name}</div>
                          <div className="text-xs text-slate-300 font-mono leading-relaxed break-words">
                              {ex.sets.map(s => `${s.weight}кг-${s.reps}`).join(', ')}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 text-sm border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-950/30">
                      <span>Нет упражнений</span>
                      <span className="text-xs mt-1 text-slate-600">Нажмите, чтобы добавить</span>
                  </div>
              )}
          </div>
      </div>

      {/* Mini Calendar - Modern Style */}
      <div 
        className="border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden bg-cover bg-center"
        style={{ 
            backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.9)), url("https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop")' 
        }}
      >
           <h2 className="text-lg font-semibold mb-6 tracking-wide text-center uppercase text-slate-200 relative z-10">{currentDisplayDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</h2>
           <div className="grid grid-cols-7 gap-2 text-center text-xs relative z-10">
                {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map((d, i) => <span key={i} className="text-slate-500 font-bold mb-2">{d}</span>)}
                {calendarGrid.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} />;
                    }
                    const dStr = `${currentDisplayDate.getFullYear()}-${String(currentDisplayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const log = workoutLogs[dStr];
                    const isSelected = selectedDate === dStr;
                    const isPR = prDays.has(dStr);
                    
                    return (
                        <div 
                            key={day} 
                            onClick={() => setDate(dStr)}
                            className={`
                                aspect-square flex items-center justify-center rounded-xl cursor-pointer relative transition-all duration-300 font-medium
                                ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 z-10' : ''}
                                ${log?.color ? 'text-white shadow-lg' : (isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'hover:bg-slate-700/50 text-slate-400 bg-slate-950/30')}
                            `}
                            style={{ backgroundColor: log?.color || undefined }}
                        >
                            {day}
                            {!!log && !isSelected && !log.color && <div className="absolute bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]"></div>}
                            {isPR && (
                                <Trophy size={10} className="absolute top-0.5 right-0.5 text-yellow-400 drop-shadow-md animate-pulse" fill="#facc15" />
                            )}
                        </div>
                    )
                })}
           </div>
      </div>

      {/* Weight Log Modal */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold mb-6 text-white">Записать вес</h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Дата</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider ml-1">Вес (кг)</label>
                <input
                  type="number"
                  placeholder="например, 84.5"
                  value={modalWeight}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setModalWeight(e.target.value)}
                  className="w-full bg-slate-950/50 p-4 rounded-2xl outline-none border border-slate-700/50 mt-2 focus:border-emerald-500 focus:bg-slate-900 transition-all text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsWeightModalOpen(false)} className="flex-1 py-3.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors">Отмена</button>
              <button onClick={handleSaveWeight} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
       <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={userProfile}
        goals={userGoals}
        onSaveProfile={updateUserProfile}
        onSaveGoals={updateUserGoals}
        onExport={getAllData}
        onImport={importData}
      />
    </div>
    </div>
  );
};

const MacroProgress: React.FC<{ label: string; current: number; total: number; color: string }> = ({ label, current, total, color }) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-end text-xs mb-1.5 font-medium">
                <span className="text-slate-400">{label}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm whitespace-nowrap">{Math.round(current)} <span className="text-slate-500 text-xs">/ {total}г</span></span>
                    <span className={`text-[10px] min-w-[24px] text-right ${percentage >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {percentage}%
                    </span>
                </div>
            </div>
            <div className="h-2.5 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
                <div 
                    className={`h-full ${color} rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-500`} 
                    style={{ width: `${Math.min(100, percentage)}%` }}
                ></div>
            </div>
        </div>
    );
};

export default HomePage;
