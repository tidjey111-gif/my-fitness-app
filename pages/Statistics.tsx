import React, { useMemo } from 'react';
import { useApp } from '../App';
import { 
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { 
    Activity, Flame, Scale, TrendingUp, TrendingDown, Minus, Dumbbell, CalendarRange 
} from 'lucide-react';

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const name = payload[0].name;
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

  // --- Data Processing (Last 10 Days) ---
  const { data, averages } = useMemo(() => {
      const dates = [];
      const today = new Date();
      
      // Generate last 10 days
      for(let i=9; i>=0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const offset = d.getTimezoneOffset() * 60000;
          const localISODate = new Date(d.getTime() - offset).toISOString().split('T')[0];
          dates.push(localISODate);
      }

      // Process Data Points
      let totalCals = 0;
      let totalVol = 0;
      let weightCount = 0;
      let calorieCount = 0;
      let volumeCount = 0;

      // Find first and last weight for trend
      const validWeights = weightHistory.filter(w => dates.includes(w.date));
      const startWeight = validWeights.length > 0 ? validWeights[0].weight : 0;
      const endWeight = validWeights.length > 0 ? validWeights[validWeights.length - 1].weight : 0;
      const weightDiff = endWeight - startWeight;

      const processedData = dates.map(date => {
          // Date Formatting
          const [y, m, d] = date.split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
          const shortDate = dateObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

          // Weight
          let weight = null;
          const exactWeight = weightHistory.find(w => w.date === date);
          if (exactWeight) {
              weight = exactWeight.weight;
          } else {
              const prev = [...weightHistory].sort((a,b) => a.date.localeCompare(b.date)).filter(w => w.date < date);
              if (prev.length > 0) weight = prev[prev.length - 1].weight;
          }
          if (weight) weightCount++;

          // Calories
          const foodLog = foodLogs[date];
          const calories = foodLog ? foodLog.items.reduce((a, b) => a + b.calories, 0) : 0;
          if (calories > 0) {
              totalCals += calories;
              calorieCount++;
          }

          // Volume
          const workLog = workoutLogs[date];
          let volume = 0;
          if (workLog) {
              workLog.exercises.forEach(ex => {
                  ex.sets.forEach(s => volume += (s.weight * s.reps));
              });
          }
          if (volume > 0) {
              totalVol += volume;
              volumeCount++;
          }

          return {
              date,
              formattedDate,
              shortDate,
              weight,
              calories,
              volume
          };
      });

      return {
          data: processedData,
          averages: {
              avgCalories: calorieCount > 0 ? Math.round(totalCals / calorieCount) : 0,
              totalVolume: totalVol,
              weightTrend: weightDiff
          }
      };
  }, [weightHistory, foodLogs, workoutLogs]);

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
                        <span>Последние 10 дней</span>
                    </div>
                </div>
            </div>

            {/* Weight Chart */}
            <StatCard 
                title="Динамика веса" 
                icon={<Scale size={16} className="text-purple-400"/>}
                mainValue={`${data[data.length-1]?.weight || '-'} кг`}
                subValue={averages.weightTrend !== 0 ? `${averages.weightTrend > 0 ? '+' : ''}${averages.weightTrend.toFixed(1)} кг` : undefined}
                trend={averages.weightTrend > 0 ? 'up' : averages.weightTrend < 0 ? 'down' : 'neutral'}
                colorClass="bg-purple-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
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

            {/* Calories Chart */}
            <StatCard 
                title="Калорийность" 
                icon={<Flame size={16} className="text-emerald-400"/>}
                mainValue={`${averages.avgCalories}`}
                subValue="ккал / день (среднее)"
                colorClass="bg-emerald-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="shortDate" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickMargin={10} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)', radius: 6}}
                            content={<CustomTooltip />}
                        />
                        <Bar dataKey="calories" name="Калории" unit="ккал" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.calories > 2500 ? '#ef4444' : '#10b981'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </StatCard>

            {/* Volume Chart */}
            <StatCard 
                title="Тоннаж тренировок" 
                icon={<Dumbbell size={16} className="text-blue-400"/>}
                mainValue={(averages.totalVolume / 1000).toFixed(1) + ' т'}
                subValue="всего за период"
                colorClass="bg-blue-500"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="gradVol" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="shortDate" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickMargin={10} />
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