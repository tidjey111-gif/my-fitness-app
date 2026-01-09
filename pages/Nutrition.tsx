
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { Camera, Search, Plus, X, Loader2, Save, Calendar, ChevronLeft, ChevronRight, Copy, Edit2, Trash2, Check, Utensils, Sparkles } from 'lucide-react';
import { analyzeFoodImage, analyzeFoodText } from '../services/geminiService';
import { FoodItem, FoodLog, MealType } from '../types';
import { getWeekDays } from '../utils';

// --- Utility: Image Compression ---
const compressImage = (base64Str: string, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
    });
};

// --- Sub-components ---

const DayProgressVisual: React.FC<{ date: string }> = ({ date }) => {
    const { foodLogs, userGoals } = useApp();
    const log = foodLogs[date];
    const consumed = log ? log.items.reduce((acc, item) => acc + item.calories, 0) : 0;
    const goal = userGoals.calories;
    const progress = goal > 0 ? (consumed / goal) * 100 : 0;
    
    const height = Math.min(100, Math.max(0, progress));
    const isExceeded = progress > 100;
    const isCompleted = progress >= 100;
    
    let bgColor = "bg-emerald-500/90";
    if (isExceeded) bgColor = "bg-red-600/90";
    else if (isCompleted) bgColor = "bg-emerald-600";

    const bubbles = useMemo(() => Array.from({ length: 4 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 80 + 10}%`,
        animationDuration: `${Math.random() * 2 + 1.5}s`,
        animationDelay: `${Math.random()}s`
    })), []);

    if (progress === 0) return null;

    return (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
             <div 
                className={`absolute bottom-0 left-0 right-0 transition-all duration-700 ease-in-out ${bgColor}`}
                style={{ height: `${height}%` }}
            >
                <div 
                    className="absolute -top-[5px] left-1/2 w-[160%] h-[10px] bg-white/20 rounded-[50%]"
                    style={{ animation: 'wave-slosh 3s ease-in-out infinite' }}
                ></div>
                {bubbles.map((b) => (
                    <div 
                        key={b.id}
                        className="bubble"
                        style={{
                            left: b.left,
                            animationDuration: b.animationDuration,
                            animationDelay: b.animationDelay
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

const WeekView: React.FC = () => {
    const { selectedDate, setDate } = useApp();
    const weekDays = getWeekDays(selectedDate);
    
    return (
        <div className="flex justify-between items-center mb-6 bg-slate-900/60 p-2 rounded-xl border border-white/5 backdrop-blur-md shadow-lg">
            {weekDays.map(day => {
                const dayStr = day.toISOString().split('T')[0];
                const isSelected = dayStr === selectedDate;

                return (
                    <button
                        key={dayStr}
                        onClick={() => setDate(dayStr)}
                        className={`
                            flex flex-col items-center justify-center w-10 h-14 rounded-lg transition-all duration-300 relative overflow-hidden
                            ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-10' : 'hover:bg-slate-800'}
                        `}
                    >
                        <DayProgressVisual date={dayStr} />
                        <span className={`text-[10px] uppercase z-10 ${isSelected ? 'text-white font-bold' : 'text-slate-500'}`}>
                            {day.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' })}
                        </span>
                        <span className={`font-bold text-lg z-10 ${isSelected ? 'text-white' : 'text-slate-300'}`}>{day.getUTCDate()}</span>
                    </button>
                );
            })}
        </div>
    );
};

interface CalendarModalProps {
    onClose: () => void;
    mode: 'NAVIGATE' | 'COPY_DAY' | 'COPY_MEAL';
    setMode: (m: 'NAVIGATE' | 'COPY_DAY' | 'COPY_MEAL') => void;
    mealTypeToCopy?: MealType | null;
}

const CalendarModal: React.FC<CalendarModalProps> = ({ onClose, mode, setMode, mealTypeToCopy }) => {
    const { selectedDate, setDate, foodLogs, updateFoodLog, copyMealGroup } = useApp();
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate));

    const changeMonth = (amount: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            newDate.setUTCMonth(newDate.getUTCMonth() + amount);
            return newDate;
        });
    };
    
    const handleDayClick = (dateStr: string) => {
        if (mode === 'COPY_DAY') {
            const logToCopy = foodLogs[selectedDate];
            if (logToCopy) {
                const newLog = {
                    ...JSON.parse(JSON.stringify(logToCopy)),
                    id: Math.random().toString(),
                    date: dateStr,
                };
                newLog.items.forEach((item: FoodItem) => {
                    item.id = Math.random().toString();
                });
                updateFoodLog(dateStr, newLog);
                setMode('NAVIGATE');
                setDate(dateStr);
                onClose();
            }
        } else if (mode === 'COPY_MEAL' && mealTypeToCopy) {
            copyMealGroup(selectedDate, dateStr, mealTypeToCopy);
            setMode('NAVIGATE');
            setDate(dateStr);
            onClose();
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
    
    const getModalTitle = () => {
        if (mode === 'COPY_DAY') return <span className="text-emerald-400">Копировать день на...</span>;
        if (mode === 'COPY_MEAL') {
             const mealLabels: Record<MealType, string> = {
                breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус'
            };
            return <span className="text-emerald-400">Копировать {mealLabels[mealTypeToCopy!] || 'прием'} на...</span>;
        }
        return displayDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleIn">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="font-bold text-lg capitalize">
                        {getModalTitle()}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-full"><ChevronLeft size={18}/></button>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-full"><ChevronRight size={18}/></button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full"><X size={18}/></button>
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
                        const isSelected = dateStr === selectedDate && mode === 'NAVIGATE';
                        const isTarget = mode !== 'NAVIGATE';
                        
                        return (
                            <button
                                key={day}
                                onClick={() => handleDayClick(dateStr)}
                                className={`
                                    aspect-square flex items-center justify-center rounded-lg transition-all relative font-medium overflow-hidden 
                                    ${isSelected ? 'ring-2 ring-white' : 'hover:bg-slate-800'}
                                    ${isTarget ? 'hover:bg-emerald-500/50 cursor-pointer' : ''}
                                `}
                            >
                                <DayProgressVisual date={dateStr} />
                                <span className={`z-10 ${isSelected ? 'text-white' : 'text-slate-200'}`}>{day}</span>
                            </button>
                        );
                    })}
                </div>

                 <div className="mt-6 border-t border-slate-800 pt-4">
                    {mode !== 'NAVIGATE' ? (
                        <button onClick={() => setMode('NAVIGATE')} className="w-full text-center py-2 bg-slate-700 text-white rounded-lg">Отменить копирование</button>
                    ) : (
                         <button 
                            onClick={() => setMode('COPY_DAY')}
                            disabled={!foodLogs[selectedDate] || foodLogs[selectedDate].items.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 text-emerald-400 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Copy size={16}/> Копировать весь день
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Main Component ---

const NutritionPage: React.FC = () => {
  const { selectedDate, setDate, addFoodItem, editFoodItem, deleteFoodItem, foodLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'NAVIGATE' | 'COPY_DAY' | 'COPY_MEAL'>('NAVIGATE');
  const [mealTypeToCopy, setMealTypeToCopy] = useState<MealType | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  
  // AI Text Input State
  const [showAiInput, setShowAiInput] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<FoodItem>>({
      name: '', calories: 0, protein: 0, fat: 0, carbs: 0, grams: 100, mealType: 'breakfast'
  });

  const [per100g, setPer100g] = useState<{calories: number, protein: number, fat: number, carbs: number} | null>(null);
  const [suggestions, setSuggestions] = useState<FoodItem[]>([]);
  
  useEffect(() => {
    const allItems = Object.values(foodLogs).flatMap((log: any) => log.items) as FoodItem[];
    const uniqueItemsMap = new Map<string, FoodItem>();
    allItems.forEach(item => {
        if (!item.name) return;
        uniqueItemsMap.set(item.name.toLowerCase(), item);
    });
    setSuggestions(Array.from(uniqueItemsMap.values()));
  }, [foodLogs]);

  const handleDateChange = (days: number) => {
      const date = new Date(selectedDate);
      date.setUTCDate(date.getUTCDate() + days);
      setDate(date.toISOString().split('T')[0]);
  };

  const filteredSuggestions = suggestions.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.length > 0
  );

  const calculatePer100g = (item: Partial<FoodItem>) => {
      const grams = item.grams || 100;
      if (grams <= 0) return null;
      return {
          calories: (item.calories || 0) / grams * 100,
          protein: (item.protein || 0) / grams * 100,
          fat: (item.fat || 0) / grams * 100,
          carbs: (item.carbs || 0) / grams * 100
      };
  };

  const handleSuggestionClick = (item: FoodItem) => {
      setSearchTerm('');
      setFormData({
          ...item,
          id: undefined,
          mealType: formData.mealType,
      });
      setPer100g(calculatePer100g(item));
  };

  const handleSaveItem = () => {
      if (!formData.name) return;
      const mealType = formData.mealType || 'breakfast';

      const finalItem = { ...formData, mealType } as FoodItem;

      if (isEditing && formData.id) {
          editFoodItem(selectedDate, finalItem);
      } else {
          addFoodItem(selectedDate, { ...finalItem, id: Math.random().toString() });
      }
      
      resetForm();
  };

  const resetForm = () => {
      setFormData({ name: '', calories: 0, protein: 0, fat: 0, carbs: 0, grams: 100, mealType: 'breakfast', image: undefined });
      setPer100g(null);
      setIsAdding(false);
      setIsEditing(false);
      setSearchTerm('');
      setShowAiInput(false);
      setAiQuery('');
  };

  const startEdit = (item: FoodItem) => {
      setFormData({ ...item });
      setPer100g(calculatePer100g(item));
      setIsEditing(true);
      setIsAdding(true);
  };

  const confirmDelete = () => {
      if (deleteConfirmation) {
          deleteFoodItem(selectedDate, deleteConfirmation);
          setDeleteConfirmation(null);
      }
  };

  const handleAiTextAnalyze = async () => {
      if (!aiQuery.trim()) return;
      setIsAnalyzing(true);
      try {
          const result = await analyzeFoodText(aiQuery);
          if (result) {
              const itemData = {
                  ...formData,
                  name: result.foodName || aiQuery,
                  calories: result.calories || 0,
                  protein: result.protein || 0,
                  fat: result.fat || 0,
                  carbs: result.carbs || 0,
                  grams: result.estimatedWeightGrams || 100
              };
              setFormData(itemData);
              setPer100g(calculatePer100g(itemData));
              setShowAiInput(false); // Close the input after success
              setAiQuery('');
          } else {
              alert('Не удалось распознать блюдо. Попробуйте описать подробнее или проверить соединение.');
          }
      } catch (e) {
          console.error(e);
          alert('Ошибка соединения с AI. Попробуйте еще раз.');
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64String = reader.result as string;
        
        // COMPRESS BEFORE SENDING AND SAVING
        const compressedBase64 = await compressImage(rawBase64String);
        const base64Data = compressedBase64.split(',')[1];
        
        const result = await analyzeFoodImage(base64Data);
        
        if (result) {
          const itemData = {
            ...formData,
            name: result.foodName || 'Неизвестное блюдо',
            calories: result.calories || 0,
            protein: result.protein || 0,
            fat: result.fat || 0,
            carbs: result.carbs || 0,
            grams: result.estimatedWeightGrams || 100,
            image: compressedBase64
          };
          setFormData(itemData);
          setPer100g(calculatePer100g(itemData));
        } else {
             alert('Не удалось распознать изображение. Попробуйте другое фото.');
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      alert('Ошибка при обработке изображения.');
      setIsAnalyzing(false);
    }
  };

  const handleManualMetricChange = (field: keyof FoodItem, value: number) => {
      const newFormData = { ...formData, [field]: value };
      setFormData(newFormData);
      if (formData.grams && formData.grams > 0) {
          const factor = 100 / formData.grams;
          setPer100g(prev => ({
              calories: field === 'calories' ? value * factor : (prev?.calories || 0),
              protein: field === 'protein' ? value * factor : (prev?.protein || 0),
              fat: field === 'fat' ? value * factor : (prev?.fat || 0),
              carbs: field === 'carbs' ? value * factor : (prev?.carbs || 0),
          }));
      }
  };

  const log = foodLogs[selectedDate];
  const items = log ? log.items : [];

  const groupedItems = {
      breakfast: items.filter(i => i.mealType === 'breakfast'),
      lunch: items.filter(i => i.mealType === 'lunch'),
      dinner: items.filter(i => i.mealType === 'dinner'),
      snack: items.filter(i => i.mealType === 'snack')
  };

  const mealLabels: Record<MealType, string> = {
      breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус'
  };

  const mealImages: Record<MealType, string> = {
      breakfast: 'https://images.unsplash.com/photo-1533089862017-5614ec95e214?q=80&w=2070&auto=format&fit=crop',
      lunch: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop',
      dinner: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2069&auto=format&fit=crop',
      snack: 'https://images.unsplash.com/photo-1595855793393-35222e4c2780?q=80&w=2070&auto=format&fit=crop'
  }

  return (
    <div className="relative min-h-screen">
       <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
            backgroundImage: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.95)), url("https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop")',
            zIndex: -1
        }}
       ></div>

       <div className="p-4 pb-24 relative z-10">
           <div 
            className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl mb-4 sticky top-0 z-20 backdrop-blur-md border border-white/10 shadow-xl bg-cover bg-center overflow-hidden"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85)), url("https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=2070&auto=format&fit=crop")' 
            }}
           >
              <button onClick={() => handleDateChange(-1)} className="p-2 hover:bg-slate-800/80 rounded-full relative z-10"><ChevronLeft /></button>
              <div className="text-center cursor-pointer relative z-10" onClick={() => { setCalendarMode('NAVIGATE'); setIsCalendarOpen(true); }}>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">{new Date(selectedDate).toLocaleDateString('ru-RU', { weekday: 'long', timeZone: 'UTC' })}</div>
                  <div className="font-bold text-lg text-emerald-400">{new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(' г.', '')}</div>
              </div>
              <div className="flex items-center relative z-10">
                 <button onClick={() => handleDateChange(1)} className="p-2 hover:bg-slate-800/80 rounded-full"><ChevronRight /></button>
                 <button onClick={() => { setCalendarMode('NAVIGATE'); setIsCalendarOpen(true); }} className="p-2 hover:bg-slate-800/80 rounded-full ml-1"><Calendar size={20}/></button>
              </div>
          </div>
          
          <WeekView />

          <div className="space-y-6">
              {(Object.keys(groupedItems) as MealType[]).map((type) => {
                  const groupItems = groupedItems[type];
                  if (groupItems.length === 0) return null;

                  return (
                      <div 
                        key={type} 
                        className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 relative overflow-hidden bg-cover bg-center shadow-lg"
                        style={{ 
                            backgroundImage: `linear-gradient(to bottom right, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.90)), url("${mealImages[type]}")` 
                        }}
                      >
                          <div className="flex justify-between items-center mb-4 relative z-10">
                              <h3 className="font-bold text-lg capitalize flex items-center gap-2">
                                  {mealLabels[type]}
                                  <span className="text-sm font-normal text-slate-400 ml-2">
                                      {groupItems.reduce((acc, i) => acc + i.calories, 0)} ккал
                                  </span>
                              </h3>
                               <button 
                                    onClick={() => { setMealTypeToCopy(type); setCalendarMode('COPY_MEAL'); setIsCalendarOpen(true); }}
                                    className="text-slate-400 hover:text-emerald-400 p-2 rounded-full hover:bg-slate-800/80 transition-colors"
                                    title="Копировать этот прием пищи на другой день"
                               >
                                    <Copy size={16} />
                               </button>
                          </div>
                          
                          <div className="space-y-3 relative z-10">
                              {groupItems.map(item => (
                                  <div key={item.id} className="bg-slate-950/60 rounded-xl p-3 flex justify-between items-center group border border-white/5 backdrop-blur-sm">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          {item.image ? (
                                               <img src={item.image} alt={item.name} className="w-12 h-12 min-w-[3rem] rounded-lg object-cover border border-slate-700" />
                                          ) : (
                                               <div className="w-12 h-12 min-w-[3rem] rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-600">
                                                    <Utensils size={20} />
                                               </div>
                                          )}
                                          
                                          <div className="min-w-0">
                                              <div className="font-medium text-slate-200 truncate">{item.name}</div>
                                              <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">
                                                  <span>{item.calories} ккал</span>
                                                  <span>•</span>
                                                  <span>{item.grams} г</span>
                                                  <span className="text-emerald-400">Б: {item.protein}</span>
                                                  <span className="text-blue-400">У: {item.carbs}</span>
                                                  <span className="text-yellow-400">Ж: {item.fat}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex gap-2 shrink-0 ml-2">
                                          <button onClick={() => startEdit(item)} className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full"><Edit2 size={16}/></button>
                                          <button onClick={() => setDeleteConfirmation(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-full"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })}
              
              {items.length === 0 && (
                   <div className="text-center py-10 text-slate-500">
                       В этот день записей нет.
                   </div>
              )}
          </div>

          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform z-40"
          >
            <Plus size={28} />
          </button>

          {isAdding && (
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slideUp sm:animate-scaleIn h-[90vh] sm:h-auto overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">{isEditing ? 'Редактировать продукт' : 'Добавить продукт'}</h2>
                        <button onClick={resetForm}><X /></button>
                    </div>

                    {!isEditing && !formData.image && (
                        <>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                            >
                                <div className="bg-slate-900 rounded-[10px] h-full p-4 flex flex-col items-center justify-center gap-2">
                                    {isAnalyzing ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                                    <span className="font-bold text-white text-sm text-center">Сканировать (AI)</span>
                                </div>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div 
                                onClick={() => setShowAiInput(!showAiInput)}
                                className={`p-0.5 rounded-xl cursor-pointer hover:opacity-90 transition-all duration-300 relative overflow-hidden ${showAiInput ? 'bg-emerald-500 scale-105' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`}
                            >
                                <div className="bg-slate-900 rounded-[10px] h-full p-4 flex flex-col items-center justify-center gap-2">
                                     <Sparkles className={showAiInput ? "text-emerald-400" : "text-white"} size={24} />
                                     <span className="font-bold text-white text-sm text-center">Описать (AI)</span>
                                </div>
                            </div>
                        </div>

                        {showAiInput && (
                            <div className="mb-6 animate-fadeIn">
                                <textarea
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="Опишите еду, например: 'Большая тарелка борща со сметаной' или 'Куриная грудка 150г'"
                                    className="w-full bg-slate-800 p-3 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 min-h-[80px] text-white"
                                />
                                <button 
                                    onClick={handleAiTextAnalyze}
                                    disabled={isAnalyzing || !aiQuery.trim()}
                                    className="w-full mt-2 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-xl font-bold hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                    Рассчитать БЖУ (AI)
                                </button>
                            </div>
                        )}
                        
                        <div className="relative mb-6">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-700" />
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-slate-900 px-2 text-sm text-slate-500">ИЛИ ВВЕДИТЕ ВРУЧНУЮ</span>
                          </div>
                        </div>
                        </>
                    )}

                    {formData.image && (
                        <div className="mb-4 flex justify-center relative">
                            <img src={formData.image} alt="Preview" className="h-40 rounded-xl object-cover border border-slate-700 w-full" />
                            {!isEditing && (
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, image: undefined }))}
                                    className="absolute top-2 right-2 bg-black/60 p-1 rounded-full text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold">Название</label>
                             <div className="relative mt-1">
                                <input
                                    value={isEditing ? formData.name : searchTerm}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (isEditing) {
                                          setFormData({ ...formData, name: value });
                                        } else {
                                          setSearchTerm(value);
                                          if (value !== formData.name) {
                                             setFormData({ ...formData, name: value, calories: 0, protein: 0, fat: 0, carbs: 0, grams: 100 });
                                             setPer100g(null);
                                          }
                                        }
                                    }}
                                    placeholder="например, Яблоко"
                                    className="w-full bg-slate-800 p-3 pl-10 rounded-xl outline-none border border-slate-700 focus:border-emerald-500"
                                />
                                <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                            </div>
                            {searchTerm && filteredSuggestions.length > 0 && !isEditing && (
                                <div className="relative w-full">
                                    <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                        {filteredSuggestions.map((item, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handleSuggestionClick(item)}
                                                className="p-3 hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-700 last:border-none flex items-center gap-2"
                                            >
                                                {item.image && <img src={item.image} className="w-8 h-8 rounded object-cover" alt="" />}
                                                <div className="font-medium text-white">{item.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div>
                             <label className="text-xs text-slate-500 uppercase font-bold">Прием пищи</label>
                             <select
                                value={formData.mealType}
                                onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MealType })}
                                className="w-full bg-slate-800 p-3 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1"
                             >
                                 {Object.entries(mealLabels).map(([key, label]) => (
                                     <option key={key} value={key}>{label}</option>
                                 ))}
                             </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Калории</label>
                                <input
                                    type="number"
                                    value={formData.calories || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleManualMetricChange('calories', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-800 p-3 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold">Вес (г)</label>
                                <input
                                    type="number"
                                    value={formData.grams || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const newGrams = parseFloat(e.target.value) || 0;
                                        setFormData(prev => {
                                            if (per100g) {
                                                const ratio = newGrams / 100;
                                                return {
                                                    ...prev,
                                                    grams: newGrams,
                                                    calories: Math.round(per100g.calories * ratio),
                                                    protein: parseFloat((per100g.protein * ratio).toFixed(1)),
                                                    fat: parseFloat((per100g.fat * ratio).toFixed(1)),
                                                    carbs: parseFloat((per100g.carbs * ratio).toFixed(1)),
                                                };
                                            }
                                            return { ...prev, grams: newGrams };
                                        });
                                    }}
                                    className="w-full bg-slate-800 p-3 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                             <div>
                                <label className="text-xs text-slate-500 uppercase font-bold text-emerald-400">Белки</label>
                                <input
                                    type="number"
                                    value={formData.protein || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleManualMetricChange('protein', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-800 p-2 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1 text-center"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold text-yellow-400">Жиры</label>
                                <input
                                    type="number"
                                    value={formData.fat || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleManualMetricChange('fat', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-800 p-2 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1 text-center"
                                />
                            </div>
                             <div>
                                <label className="text-xs text-slate-500 uppercase font-bold text-blue-400">Углеводы</label>
                                <input
                                    type="number"
                                    value={formData.carbs || ''}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => handleManualMetricChange('carbs', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-slate-800 p-2 rounded-xl outline-none border border-slate-700 focus:border-emerald-500 mt-1 text-center"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveItem}
                        className="w-full mt-8 py-4 bg-emerald-500 rounded-xl text-white font-bold text-lg shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform"
                    >
                        {isEditing ? 'Сохранить изменения' : 'Добавить в дневник'}
                    </button>
                </div>
              </div>
          )}

          {deleteConfirmation && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
                        <h3 className="text-xl font-bold mb-2 text-red-400">Удалить запись?</h3>
                        <p className="text-slate-400 mb-6">Вы уверены, что хотите удалить этот продукт?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300">Отмена</button>
                            <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold">Удалить</button>
                        </div>
                  </div>
              </div>
          )}
          
          {isCalendarOpen && (
            <CalendarModal 
                onClose={() => setIsCalendarOpen(false)} 
                mode={calendarMode} 
                setMode={setCalendarMode}
                mealTypeToCopy={mealTypeToCopy}
            />
          )}
        </div>
    </div>
  );
};

export default NutritionPage;
