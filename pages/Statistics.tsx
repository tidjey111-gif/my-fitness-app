
import React, { useMemo } from 'react';
import { useApp } from '../App';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
    Activity, Flame, Scale, TrendingUp, TrendingDown, Minus, Dumbbell, CalendarRange 
} from 'lucide-react';

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const unit = payload[0].unit;

    return (
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-slate-400 text-xs font-medium mb-1">{data.formattedDate}</p>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
            <p className="text-white font-bold text-lg">
                {value} <span className="text-xs text-slate-500 font-normal">{unit}</span>
            </p>
        </div>
      </div>
    );
  }
  return null;
};

// --- Stat Card Component ---
const StatCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    mainValue: string | number;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral';
    children: React.ReactNode;
    colorClass: string;
}> = ({ title, icon, mainValue, subValue, trend, children, colorClass }) => {
    return (
        <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider flex items-center gap-2 mb-1">
                        {icon} {title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">{mainValue}</span>
                        {subValue && <span className="text-sm text-slate-500">{subValue}</span>}
                    </div>
                </div>
                {trend && (
                    <div className={`p-2 rounded-xl bg-white/5 border border-white/5 ${
                        trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                        {trend === 'up' && <TrendingUp size={20} />}
                        {trend === 'down' && <TrendingDown size={20} />}
                        {trend === 'neutral' && <Minus size={20} />}
                    </div>
                )}
            </div>

            {/* Chart Area */}
            <div className="h-48 w-full relative z-10">
                {children}
            </div>

            {/* Background Decor */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-20 ${colorClass}`}></div>
        </div>
    );
};

const StatisticsPage: React.FC = () => {
  const { weightHistory, foodLogs, workoutLogs } = useApp();

  // --- Data Processing for Calendar Charts (Last 10 Days) ---
  const { calendarData, calorieAvg, weightTrendInfo } = useMemo(() => {
      const dates = [];
      const today = new Date();
      
      for(let i=9; i>=0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const offset = d.getTimezoneOffset() * 60000;
          const localISODate = new Date(d.getTime() - offset).toISOString().split('T')[0];
          dates.push(localISODate);
      }

      let totalCals = 0;
      let calorieCount = 0;

      const validWeights = weightHistory.filter(w => dates.includes(w.date));
      const startWeight = validWeights.length > 0 ? validWeights[0].weight : 0;
      const endWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].weight : 0;
      const weightDiff = endWeight - startWeight;

      const processed = dates.map(date => {
          const [y, m, d] = date.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          
          let weight = null;
          const exactWeight = weightHistory.find(w => w.date === date);
          if (exactWeight) {
              weight = exactWeight.weight;
          } else {
              const prev = [...weightHistory].sort((a,b) => a.date.localeCompare(b.date)).filter(w => w.date < date);
              if (prev.length > 0) weight = prev[prev.length - 1].weight;
          }

          const foodLog = foodLogs[date];
          const calories = foodLog ? foodLog.items.reduce((a, b) => a + b.calories, 0) : 0;
          if (calories > 0) {
              totalCals += calories;
              calorieCount++;
          }

          return {
              date,
              formattedDate: dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
              shortDate: dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
              weight,
              calories
          };
      });

      return {
          calendarData: processed,
          calorieAvg: calorieCount > 0 ? Math.round(totalCals / calorieCount) : 0,
          weightTrendInfo: {
              current: endWeight,
              diff: weightDiff
          }
      };
  }, [weightHistory, foodLogs]);

  // --- Data Processing for Workout Volume (Last 10 WORKOUTS) ---
  const workoutVolumeInfo = useMemo(() => {
    // Get all dates from logs and sort them
    const allWorkoutDates = Object.keys(workoutLogs).sort((a, b) => a.localeCompare(b));
    
    // Map to volume data and filter out zero-volume days
    const sessions = allWorkoutDates.map(date => {
        const log = workoutLogs[date];
        let volume = 0;
        if (log) {
            log.exercises.forEach(ex => {
                ex.sets.forEach(s => volume += (s.weight * s.reps));
            });
        }
        
        if (volume === 0) return null;

        const [y, m, d] = date.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        return {
            date,
            formattedDate: dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
            shortDate: dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            volume
        };
    }).filter(s => s !== null);

    // Take the last 10 actual workouts
    const lastTenWorkouts = sessions.slice(-10);
    const totalVolumePeriod = lastTenWorkouts.reduce((acc, curr) => acc + curr!.volume, 0);

    return {
        data: lastTenWorkouts,
        totalVolume: totalVolumePeriod
    };
  }, [workoutLogs]);

  return (
    <div className="relative min-h-screen">
        {/* Full Page Background */}
        <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                backgroundImage: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.95), rgba(2, 6, 23, 0.9)), url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop")',
                zIndex: -1
            }}
        ></div>

        <div className="p-4 pb-24 relative z-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">Статистика</h1>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                        <CalendarRange size={14} />
                        <span>История активности</span>
                    </div>
                </div>
            </div>

            {/* Weight Chart (Calendar-based) */}
            <StatCard 
                title="Динамика веса" 
                icon={<Scale size={16} className="text-purple-400"/>}
                mainValue={`${weightTrendInfo.current || '-'} кг`}
                subValue={weightTrendInfo.diff !== 0 ? `${weightTrendInfo.diff > 0 ? '+' : ''}${weightTrendInfo.diff.toFixed(1)} кг` : undefined}
                trend={weightTrendInfo.diff > 0 ? 'up' : weightTrendInfo.diff < 0 ? 'down' : 'neutral'}
                colorClass="bg-purple-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={calendarData}>
                        <defs>
                            <linearGradient id="gradWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="shortDate" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a855f7', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="weight" 
                            name="Вес"
                            unit="кг"
                            stroke="#a855f7" 
                            strokeWidth={3} 
                            fill="url(#gradWeight)" 
                            activeDot={{ r: 6, fill: '#fff', stroke: '#a855f7', strokeWidth: 2 }}
                            connectNulls
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </StatCard>

            {/* Calories Chart (Calendar-based) */}
            <StatCard 
                title="Калорийность" 
                icon={<Flame size={16} className="text-emerald-400"/>}
                mainValue={`${calorieAvg}`}
                subValue="ккал / день (среднее)"
                colorClass="bg-emerald-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calendarData} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="shortDate" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickMargin={10} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)', radius: 6}}
                            content={<CustomTooltip />}
                        />
                        <Bar dataKey="calories" name="Калории" unit="ккал" radius={[4, 4, 0, 0]}>
                            {calendarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.calories > 2500 ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </StatCard>

            {/* Volume Chart (Last 10 WORKOUTS) */}
            <StatCard 
                title="Тоннаж тренировок" 
                icon={<Dumbbell size={16} className="text-blue-400"/>}
                mainValue={(workoutVolumeInfo.totalVolume / 1000).toFixed(1) + ' т'}
                subValue="за 10 последних занятий"
                colorClass="bg-blue-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={workoutVolumeInfo.data}>
                        <defs>
                            <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="shortDate" 
                            tick={{fontSize: 10, fill: '#64748b'}} 
                            axisLine={false} 
                            tickLine={false} 
                            tickMargin={10}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area 
                            type="monotone" 
                            dataKey="volume" 
                            name="Объем"
                            unit="кг"
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fill="url(#gradVol)" 
                            activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </StatCard>
        </div>
    </div>
  );
};

export default StatisticsPage;
