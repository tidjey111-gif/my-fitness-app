import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../App';
import { ChevronLeft, ChevronRight, Plus, Trash2, Trophy, MoreHorizontal, X, Save, Calendar, Copy } from 'lucide-react';
import { Exercise, ExerciseSet, WorkoutLog } from '../types';
import { getWeekDays } from '../utils';

const WORKOUT_COLORS = ['#34d399', '#f87171', '#60a5fa', '#facc15', '#a78bfa']; // Emerald, Red, Blue, Yellow, Purple

// --- Sub-components ---

const WeekView: React.FC<{ selectedDate: string; setDate: (date: string) => void }> = ({ selectedDate, setDate }) => {
    const { workoutLogs, prDays } = useApp();
    const weekDays = getWeekDays(selectedDate);
    
    return (
        <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-2 rounded-xl border border-white/5 backdrop-blur-sm">
            {weekDays.map(day => {
                const dayStr = day.toISOString().split('T')[0];
                const isSelected = dayStr === selectedDate;
                const log = workoutLogs[dayStr];
                const color = log?.color;
                const isPR = prDays.has(dayStr);

                return (
                    <button
                        key={dayStr}
                        onClick={() => setDate(dayStr)}
                        className={`
                            flex flex-col items-center justify-center w-10 h-14 rounded-lg transition-all duration-300 relative
                            ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''}
                            ${color ? 'text-white' : (isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-800 text-slate-400')}
                        `}
                        style={{ backgroundColor: color || undefined }}
                    >
                        <span className={`text-[10px] uppercase ${color || isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                            {day.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' })}
                        </span>
                        <span className="font-bold text-lg">{day.getUTCDate()}</span>
                        {log && !color && !isSelected && (
                            <div className="absolute bottom-1 w-1 h-1 bg-emerald-400 rounded-full"></div>
                        )}
                        {isPR && (
                             <Trophy size={10} className="absolute top-0.5 right-0.5 text-yellow-500 drop-shadow-md" fill="#facc15" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

const CalendarModal: React.FC<{ onClose: () => void, isCopyMode: boolean, setIsCopyMode: (isCopying: boolean) => void }> = ({ onClose, isCopyMode, setIsCopyMode }) => {
    const { selectedDate, setDate, workoutLogs, updateWorkout, prDays } = useApp();
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));

    const changeMonth = (amount: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + amount);
            return newDate;
        });
    };

    const handleColorSelect = (color: string) => {
        const log = workoutLogs[selectedDate];
        if (log) {
            updateWorkout(selectedDate, { ...log, color });
        } else {
            updateWorkout(selectedDate, {
                id: Math.random().toString(),
                date: selectedDate,
                name: 'Новая тренировка',
                exercises: [],
                color: color
            });
        }
    };
    
    const handleDayClick = (dateStr: string) => {
        if (isCopyMode) {
            const workoutToCopy = workoutLogs[selectedDate];
            if (workoutToCopy) {
                // Deep copy and re-ID workout, exercises, and sets
                const newWorkout = {
                    ...JSON.parse(JSON.stringify(workoutToCopy)),
                    id: Math.random().toString(),
                    date: dateStr,
                };
                newWorkout.exercises.forEach((ex: Exercise) => {
                    ex.id = Math.random().toString();
                    ex.sets.forEach((set: ExerciseSet) => {
                        set.id = Math.random().toString();
                        delete set.isPR; // PRs are not copied
                    });
                });

                updateWorkout(dateStr, newWorkout);
                setIsCopyMode(false);
                setDate(dateStr); // Navigate to the new date
                onClose();
            }
        } else {
            setDate(dateStr);
            onClose();
        }
    };
    
    const year = displayDate.getUTCFullYear();
    const month = displayDate.getUTCMonth();
    const firstDayRaw = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const firstDayOffset = (firstDayRaw + 6) % 7;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">
                        {isCopyMode ? <span className="text-emerald-400">Выберите дату для вставки</span> : displayDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-full"><ChevronLeft size={18}/></button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-full"><ChevronRight size={18}/></button>
                        <button onClick={() => { setIsCopyMode(false); onClose(); }} className="p-2 hover:bg-slate-800 rounded-full"><X size={18}/></button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d,i) => <div key={i}>{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`empty-${i}`}></div>)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const log = workoutLogs[dateStr];
                        const isSelected = dateStr === selectedDate && !isCopyMode;
                        const color = log?.color;
                        const isPR = prDays.has(dateStr);

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(dateStr)}
                                className={`
                                    aspect-square flex items-center justify-center rounded-lg transition-all relative font-medium
                                    ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : ''}
                                    ${color ? 'text-white' : (isSelected ? 'bg-emerald-500 text-emerald-950' : 'hover:bg-slate-800 text-slate-300')}
                                    ${isCopyMode && 'hover:bg-emerald-500/50'}
                                `}
                                style={{ backgroundColor: color || (isSelected && !color ? '#10b981' : undefined) }}
                            >
                                {day}
                                {isPR && (
                                    <Trophy size={10} className="absolute top-0.5 right-0.5 text-yellow-500 drop-shadow-md animate-pulse" fill="#facc15" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4 space-y-3">
                    {isCopyMode ? (
                        <button onClick={() => setIsCopyMode(false)} className="w-full text-center py-2 bg-slate-700 text-white rounded-lg">Отменить копирование</button>
                    ) : (
                        <>
                            <button 
                                onClick={() => setIsCopyMode(true)}
                                disabled={!workoutLogs[selectedDate]}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Copy size={16}/> Копировать эту тренировку
                            </button>
                            <div className="flex justify-around items-center">
                                {WORKOUT_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleColorSelect(color)}
                                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${workoutLogs[selectedDate]?.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800' : ''}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

const WorkoutPage: React.FC = () => {
  const { selectedDate, setDate, workoutLogs, updateWorkout, deleteWorkoutDay } = useApp();
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'EXERCISE' | 'DELETE_CONFIRM'>('EXERCISE');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const [isCopyMode, setIsCopyMode] = useState(false);
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const currentLog = workoutLogs[selectedDate] || {
      id: Math.random().toString(),
      date: selectedDate,
      name: 'Новая тренировка',
      exercises: []
  };

  const exerciseStats = useMemo(() => {
    const stats: Record<string, { maxWeight: number; repsByWeight: Record<number, number> }> = {};
    const sortedLogs = (Object.values(workoutLogs) as WorkoutLog[]).sort((a,b) => a.date.localeCompare(b.date));

    sortedLogs.forEach((log) => {
        if (log.date >= selectedDate) return;
        log.exercises.forEach((ex) => {
            const name = ex.name.trim().toLowerCase();
            if (!stats[name]) {
                stats[name] = { maxWeight: 0, repsByWeight: {} };
            }
            ex.sets.forEach((set) => {
                if (set.weight > stats[name].maxWeight) {
                    stats[name].maxWeight = set.weight;
                }
                const currentMaxReps = stats[name].repsByWeight[set.weight] || 0;
                if (set.reps > currentMaxReps) {
                    stats[name].repsByWeight[set.weight] = set.reps;
                }
            });
        });
    });
    return stats;
  }, [workoutLogs, selectedDate]);

  const checkIfPR = (exerciseName: string, weight: number, reps: number) => {
      const name = exerciseName.trim().toLowerCase();
      const history = exerciseStats[name];
      if (!history) return false;
      if (weight > history.maxWeight) return true;
      if (history.repsByWeight[weight] !== undefined && reps > history.repsByWeight[weight]) return true;
      return false;
  };

  const handleDateChange = (days: number) => {
      const date = new Date(selectedDate);
      date.setUTCDate(date.getUTCDate() + days);
      setDate(date.toISOString().split('T')[0]);
  };

  const updateLogName = (name: string) => {
      updateWorkout(selectedDate, { ...currentLog, name });
  };

  const addExercise = () => {
      if (!newExerciseName) return;
      const newEx: Exercise = {
          id: Math.random().toString(),
          name: newExerciseName,
          sets: [{ id: Math.random().toString(), weight: 0, reps: 0, isPR: false }]
      };
      updateWorkout(selectedDate, {
          ...currentLog,
          exercises: [...currentLog.exercises, newEx]
      });
      setNewExerciseName('');
      setModalOpen(false);
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof ExerciseSet, value: any) => {
      const updatedExercises = currentLog.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const updatedSets = ex.sets.map(set => {
              if (set.id !== setId) return set;
              return { ...set, [field]: value };
          });
          return { ...ex, sets: updatedSets };
      });
      updateWorkout(selectedDate, { ...currentLog, exercises: updatedExercises });
  };
  
  const updateExerciseNotes = (exerciseId: string, notes: string) => {
    const updatedExercises = currentLog.exercises.map(ex => 
        ex.id === exerciseId ? { ...ex, notes } : ex
    );
    updateWorkout(selectedDate, { ...currentLog, exercises: updatedExercises });
  };


  const addSet = (exerciseId: string) => {
    const updatedExercises = currentLog.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
            ...ex,
            sets: [...ex.sets, { 
                id: Math.random().toString(), 
                weight: lastSet ? lastSet.weight : 0, 
                reps: lastSet ? lastSet.reps : 0,
                isPR: false 
            }]
        };
    });
    updateWorkout(selectedDate, { ...currentLog, exercises: updatedExercises });
  };

  const deleteSet = (exerciseId: string, setId: string) => {
      const updatedExercises = currentLog.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }).filter(ex => ex.sets.length > 0);
      updateWorkout(selectedDate, { ...currentLog, exercises: updatedExercises });
  };

  const confirmDeleteDay = () => {
      deleteWorkoutDay(selectedDate);
      setModalOpen(false);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
        dragItem.current = null;
        dragOverItem.current = null;
        return;
    }
    
    const exercisesCopy = [...currentLog.exercises];
    const draggedItemContent = exercisesCopy.splice(dragItem.current, 1)[0];
    exercisesCopy.splice(dragOverItem.current, 0, draggedItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    updateWorkout(selectedDate, { ...currentLog, exercises: exercisesCopy });
  };

  return (
    <div className="relative min-h-screen">
       <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.9)), url("https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1975&auto=format&fit=crop")',
            zIndex: -1
        }}
       ></div>
        <div className="p-4 pb-20 relative z-10">
          <div 
            className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl mb-4 sticky top-0 z-20 backdrop-blur-md border border-white/10 shadow-xl bg-cover bg-center overflow-hidden"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop")' 
            }}
          >
              <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-slate-800/80 rounded-full relative z-10"><ChevronLeft /></button>
              <div className="text-center cursor-pointer relative z-10" onClick={() => setCalendarOpen(true)}>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', timeZone: 'UTC' })}</div>
                  <div className="font-bold text-lg text-emerald-400">{new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(' г.', '')}</div>
              </div>
              <div className="flex items-center relative z-10">
                 <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-slate-800/80 rounded-full"><ChevronRight /></button>
                 <button onClick={() => setCalendarOpen(true)} className="p-2 hover:bg-slate-800/80 rounded-full ml-1"><Calendar size={20}/></button>
              </div>
          </div>
          
          <WeekView selectedDate={selectedDate} setDate={setDate} />

          <div className="mb-6 flex justify-between items-center gap-2">
              <input 
                value={currentLog.name}
                onChange={(e) => updateLogName(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="bg-transparent text-2xl font-bold outline-none placeholder-slate-600 w-full"
                placeholder="Название тренировки..."
              />
              <div className="flex items-center gap-2 shrink-0">
                 <button 
                    onClick={() => { setIsCopyMode(true); setCalendarOpen(true); }}
                    className="text-emerald-400 bg-emerald-400/10 p-2 rounded-lg hover:bg-emerald-400/20"
                    title="Копировать тренировку на другой день"
                 >
                      <Copy size={20} />
                 </button>
                 <button 
                    onClick={() => { setModalType('DELETE_CONFIRM'); setModalOpen(true); }}
                    className="text-red-400 bg-red-400/10 p-2 rounded-lg hover:bg-red-400/20"
                    title="Удалить этот тренировочный день"
                 >
                      <Trash2 size={20} />
                 </button>
              </div>
          </div>

          <div className="space-y-6">
              {currentLog.exercises.map((exercise, index) => (
                  <div 
                    key={exercise.id} 
                    className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 animate-fadeIn cursor-grab shadow-xl relative overflow-hidden bg-cover bg-center"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    style={{ 
                        backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.98) 0%, rgba(15, 23, 42, 0.92) 100%), url("https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop")' 
                    }}
                  >
                      <div className="relative z-10">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-semibold text-lg">{exercise.name}</h3>
                              <button onClick={() => deleteSet(exercise.id, "all")} className="text-slate-500 hover:text-white transition-colors"><MoreHorizontal size={20}/></button>
                          </div>
                          
                          <textarea
                            value={exercise.notes || ''}
                            onChange={(e) => updateExerciseNotes(exercise.id, e.target.value)}
                            placeholder="Добавить заметку (например, техника, темп...)"
                            className="w-full bg-slate-950/50 rounded-lg p-3 text-sm text-orange-400 italic placeholder-slate-600 outline-none focus:ring-1 focus:ring-orange-500 mb-4 resize-none transition-colors border border-white/5"
                            rows={2}
                          />
                          
                          <div className="grid grid-cols-10 gap-2 mb-2 text-xs text-slate-500 uppercase font-bold text-center">
                              <div className="col-span-2">Подход</div>
                              <div className="col-span-3">кг</div>
                              <div className="col-span-3">Повт.</div>
                              <div className="col-span-2">Готово</div>
                          </div>

                          <div className="space-y-2">
                              {exercise.sets.map((set, idx) => {
                                  const isRecord = checkIfPR(exercise.name, set.weight, set.reps);
                                  return (
                                    <div key={set.id} className="grid grid-cols-10 gap-2 items-center">
                                        <div className="col-span-2 flex justify-center items-center">
                                            <div className="bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs text-slate-300">
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <input 
                                                type="number" 
                                                value={set.weight}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseFloat(e.target.value))}
                                                className="w-full bg-slate-950/50 rounded-md p-2 text-center text-sm outline-none focus:ring-1 focus:ring-emerald-500 border border-white/5"
                                            />
                                        </div>
                                        <div className="col-span-3 relative">
                                            <input 
                                                type="number" 
                                                value={set.reps}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseFloat(e.target.value))}
                                                className="w-full bg-slate-950/50 rounded-md p-2 text-center text-sm outline-none focus:ring-1 focus:ring-emerald-500 border border-white/5"
                                            />
                                            {isRecord && (
                                                <Trophy size={14} className="absolute -top-2 -right-2 text-yellow-400 drop-shadow-lg animate-pulse" fill="#facc15" />
                                            )}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <button onClick={() => deleteSet(exercise.id, set.id)} className="text-slate-600 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                  );
                              })}
                          </div>

                          <button 
                            onClick={() => addSet(exercise.id)}
                            className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 rounded-lg hover:bg-emerald-400/20 transition-colors"
                          >
                              <Plus size={16} /> Добавить подход
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          <button 
            onClick={() => { setModalType('EXERCISE'); setModalOpen(true); }}
            className="w-full py-4 mt-6 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all"
          >
              <Plus size={32} />
              <span className="mt-1 font-medium">Добавить упражнение</span>
          </button>

          {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
                      {modalType === 'EXERCISE' ? (
                          <>
                            <h3 className="text-xl font-bold mb-4">Добавить упражнение</h3>
                            <input 
                                autoFocus
                                value={newExerciseName}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                placeholder="например, Приседания"
                                className="w-full bg-slate-800 p-3 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mb-4"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300">Отмена</button>
                                <button onClick={addExercise} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold">Добавить</button>
                            </div>
                          </>
                      ) : (
                          <>
                            <h3 className="text-xl font-bold mb-2 text-red-400">Удалить тренировку?</h3>
                            <p className="text-slate-400 mb-6">Вы уверены, что хотите удалить всю запись о тренировке за {selectedDate}?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300">Отмена</button>
                                <button onClick={confirmDeleteDay} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Удалить</button>
                            </div>
                          </>
                      )}
                  </div>
              </div>
          )}

          {isCalendarOpen && <CalendarModal onClose={() => setCalendarOpen(false)} isCopyMode={isCopyMode} setIsCopyMode={setIsCopyMode} />}
        </div>
    </div>
  );
};

export default WorkoutPage;