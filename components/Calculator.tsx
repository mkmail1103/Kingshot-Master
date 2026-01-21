
import React, { useState, useMemo, useEffect } from 'react';
import { CalculationResult } from '../types';
import { BUILDINGS, TROOP_DATA } from '../constants';
import { Clock, Zap, Calculator as CalcIcon, AlertCircle, ArrowRight, TrendingUp, Hammer, FlaskConical, Swords, Info, Users, ChevronsUp, Gauge, Timer, CheckCircle2, Trophy, Microscope } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

type Mode = 'building' | 'research' | 'troop';
type TroopSubMode = 'train' | 'promote';

// Result types for the new multi-comparison logic
enum RecommendationType {
  ACCELERATE_NOW = 'ACCELERATE_NOW', // Use power event
  WAIT_FOR_SPEEDUP = 'WAIT_FOR_SPEEDUP', // Use speedup event
  WAIT_FOR_TRAINING = 'WAIT_FOR_TRAINING', // Use troop training event
  WAIT_FOR_RESEARCH = 'WAIT_FOR_RESEARCH', // Use research event
  EQUAL = 'EQUAL'
}

// Reusable Input Component that handles IME composition
const CompositionInput = ({
  value,
  onChange,
  placeholder,
  className,
  onFocus
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
      setLocalValue(value);
    }
  }, [value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    
    if (!isComposing) {
       onChange(raw);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    onChange(e.currentTarget.value);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      onChange={handleChange}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={handleCompositionEnd}
      onFocus={onFocus}
      placeholder={placeholder}
      className={className}
    />
  );
};

const Calculator: React.FC = () => {
  // --- Persistent State Logic ---
  const usePersistentState = (key: string, defaultValue: string) => {
    const [state, setState] = useState(() => {
      try {
        return localStorage.getItem(key) || defaultValue;
      } catch {
        return defaultValue;
      }
    });
    useEffect(() => {
      localStorage.setItem(key, state);
    }, [key, state]);
    return [state, setState] as const;
  };

  const usePersistentMode = (key: string, defaultValue: Mode) => {
    const [state, setState] = useState<Mode>(() => {
      try {
        return (localStorage.getItem(key) as Mode) || defaultValue;
      } catch {
        return defaultValue;
      }
    });
    useEffect(() => {
      localStorage.setItem(key, state);
    }, [key, state]);
    return [state, setState] as const;
  };

  const [mode, setMode] = usePersistentMode('kingshot_calc_mode', 'building');

  // Building State (Less critical to persist building ID/Level, but good for UX)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(BUILDINGS[0].id);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  // Research State (Manual)
  const [manualPowerStr, setManualPowerStr] = usePersistentState('kingshot_calc_manual_power', '');

  // Troop State
  const [troopSubMode, setTroopSubMode] = useState<TroopSubMode>('train');
  const [troopTargetLevel, setTroopTargetLevel] = useState<number>(10);
  const [troopSourceLevel, setTroopSourceLevel] = useState<number>(9);
  const [troopCount, setTroopCount] = usePersistentState('kingshot_calc_troop_count', '');

  // Time Input State (Persistent)
  const [days, setDays] = usePersistentState('kingshot_calc_days', '0');
  const [hours, setHours] = usePersistentState('kingshot_calc_hours', '0');
  const [minutes, setMinutes] = usePersistentState('kingshot_calc_minutes', '0');

  // --- Derived Values ---

  const selectedBuilding = useMemo(() => 
    BUILDINGS.find(b => b.id === selectedBuildingId) || BUILDINGS[0], 
  [selectedBuildingId]);

  // Determine Power Increase based on Mode
  const powerIncrease = useMemo(() => {
    if (mode === 'building') {
      const levelData = selectedBuilding.levels.find(l => l.level === selectedLevel);
      return levelData ? levelData.powerIncrease : 0;
    } 
    else if (mode === 'research') {
      return parseInt(manualPowerStr.replace(/,/g, '')) || 0;
    }
    else if (mode === 'troop') {
      const count = parseInt(troopCount.replace(/,/g, '')) || 0;
      const target = TROOP_DATA.find(t => t.level === troopTargetLevel)?.power || 0;
      
      if (troopSubMode === 'train') {
        // Training: Full power of the unit * count
        return target * count;
      } else {
        // Promotion: (Target Power - Source Power) * count
        const source = TROOP_DATA.find(t => t.level === troopSourceLevel)?.power || 0;
        // Ensure positive gain
        const diff = Math.max(0, target - source);
        return diff * count;
      }
    }
    return 0;
  }, [mode, selectedBuilding, selectedLevel, manualPowerStr, troopSubMode, troopTargetLevel, troopSourceLevel, troopCount]);

  // Determine Training Points (Specific to Troop Mode)
  const trainingPointsIncrease = useMemo(() => {
    if (mode !== 'troop') return 0;
    
    const count = parseInt(troopCount.replace(/,/g, '')) || 0;
    const target = TROOP_DATA.find(t => t.level === troopTargetLevel)?.trainingPoints || 0;
    
    if (troopSubMode === 'train') {
      return target * count;
    } else {
      const source = TROOP_DATA.find(t => t.level === troopSourceLevel)?.trainingPoints || 0;
      const diff = Math.max(0, target - source);
      return diff * count;
    }
  }, [mode, troopSubMode, troopTargetLevel, troopSourceLevel, troopCount]);

  // Points Multipliers
  // Building/Research: 1 Power = 30 Points (Standard Power Event)
  // Troop: 1 Power = 20 Points
  const eventPointsPerPower = mode === 'troop' ? 20 : 30;
  
  // Research Day: 1 Power = 45 Points
  const researchPointsPerPower = 45;

  const speedupPointsPerMinute = 300;

  // Threshold Calculation
  // Standard (Power Up): 1 Power = 30 Pts. 1 Min Speedup = 300 Pts.
  const thresholdStandard = useMemo(() => {
    return powerIncrease * (30 / speedupPointsPerMinute);
  }, [powerIncrease]);

  // Research Day: 1 Power = 45 Pts.
  const thresholdResearch = useMemo(() => {
    return powerIncrease * (researchPointsPerPower / speedupPointsPerMinute);
  }, [powerIncrease, researchPointsPerPower]);
  
  const currentTotalMinutes = useMemo(() => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return (d * 1440) + (h * 60) + m;
  }, [days, hours, minutes]);

  // Points calculation for display
  const pointsEvent1 = powerIncrease * eventPointsPerPower; // Total Power Event
  const pointsEvent2 = currentTotalMinutes * speedupPointsPerMinute; // Speedup Event
  const pointsEvent3 = trainingPointsIncrease; // Troop Training Event
  const pointsEvent4 = (mode === 'research') ? powerIncrease * researchPointsPerPower : 0; // Research Day Event

  // Recommendation Logic
  let recommendation: RecommendationType = RecommendationType.EQUAL;
  let winningPoints = 0;

  if (currentTotalMinutes === 0 && powerIncrease === 0) {
    // No input
  } else {
    // Determine winner
    let maxPoints = Math.max(pointsEvent1, pointsEvent2);
    
    if (mode === 'troop') {
      maxPoints = Math.max(maxPoints, pointsEvent3);
    }
    
    if (mode === 'research') {
      maxPoints = Math.max(maxPoints, pointsEvent4);
    }
    
    winningPoints = maxPoints;

    if (maxPoints === pointsEvent4 && mode === 'research') {
      recommendation = RecommendationType.WAIT_FOR_RESEARCH;
    } else if (maxPoints === pointsEvent3 && mode === 'troop') {
      recommendation = RecommendationType.WAIT_FOR_TRAINING;
    } else if (maxPoints === pointsEvent2) {
      recommendation = RecommendationType.WAIT_FOR_SPEEDUP;
    } else if (maxPoints === pointsEvent1) {
      recommendation = RecommendationType.ACCELERATE_NOW;
    }
  }

  // Efficiency Calculation (Points per Minute)
  const efficiencyEvent1 = currentTotalMinutes > 0 ? pointsEvent1 / currentTotalMinutes : 0;
  const efficiencyEvent3 = (mode === 'troop' && currentTotalMinutes > 0) ? pointsEvent3 / currentTotalMinutes : 0;
  const efficiencyEvent4 = (mode === 'research' && currentTotalMinutes > 0) ? pointsEvent4 / currentTotalMinutes : 0;

  const chartData = [
    {
      name: '総力UP (戦力P)',
      points: pointsEvent1,
      fill: '#fbbf24', // amber-400
      stroke: '#f59e0b',
    },
  ];

  if (mode === 'troop') {
    chartData.push({
      name: '訓練の日 (個数P)',
      points: pointsEvent3,
      fill: '#f43f5e', // rose-500
      stroke: '#e11d48',
    });
  }

  if (mode === 'research') {
    chartData.push({
      name: '研究の日 (戦力P)',
      points: pointsEvent4,
      fill: '#a855f7', // purple-500
      stroke: '#9333ea',
    });
  }

  // Add Speedup last to match the requested order: Power -> Research/Troop -> Speedup
  chartData.push({
    name: '加速消費 (時間P)',
    points: pointsEvent2,
    fill: '#60a5fa', // blue-400
    stroke: '#3b82f6',
  });

  // Sort chart data descending for better readability
  // chartData.sort((a, b) => b.points - a.points);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  
  const handleFormattedChange = (setter: (val: string) => void) => (rawValue: string) => {
      // 1. Convert full-width to half-width
      const normalized = rawValue.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      // 2. Remove anything that isn't a digit
      const raw = normalized.replace(/[^0-9]/g, '');
      // 3. Format with commas
      const formatted = raw ? parseInt(raw).toLocaleString() : '';
      setter(formatted);
  };
  
  // Special handler for simple numeric inputs (days, hours, minutes) which don't need commas but need full-width support
  const handleSimpleNumericChange = (setter: (val: string) => void) => (rawValue: string) => {
      const normalized = rawValue.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      const raw = normalized.replace(/[^0-9]/g, '');
      setter(raw);
  };

  // Mode Display Info
  const modeInfo = {
    building: { label: '建造', icon: Hammer, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    research: { label: '研究', icon: FlaskConical, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    troop: { label: '兵士', icon: Swords, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  };

  const CurrentIcon = modeInfo[mode].icon;

  // Helper to format minutes into D H M
  const formatThresholdTime = (minutes: number) => {
    const d = Math.floor(minutes / 1440);
    const h = Math.floor((minutes % 1440) / 60);
    const m = Math.round(minutes % 60);

    if (d > 0) return `${d}日 ${h}時間 ${m}分`;
    if (h > 0) return `${h}時間 ${m}分`;
    return `${m}分`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-500
          ${mode === 'building' ? 'from-amber-500 to-orange-600' : 
            mode === 'research' ? 'from-purple-500 to-indigo-600' : 
            'from-rose-500 to-red-600'}`}
        ></div>
        <div className="relative bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-10 shadow-2xl">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-800/50 rounded-xl mb-8 border border-white/5 overflow-x-auto">
            {(Object.keys(modeInfo) as Mode[]).map((m) => {
              const info = modeInfo[m];
              const isActive = mode === m;
              const Icon = info.icon;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap
                    ${isActive 
                      ? 'bg-slate-700 text-white shadow-lg ring-1 ring-white/10' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? info.color : ''}`} />
                  {info.label}
                </button>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
            <div className={`p-2 rounded-lg ${modeInfo[mode].bg} ${modeInfo[mode].color} transition-colors duration-300`}>
              <CurrentIcon className="w-6 h-6" />
            </div>
            {mode === 'building' && '建造データの入力'}
            {mode === 'research' && '研究データの入力'}
            {mode === 'troop' && '訓練・昇格データの入力'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- BUILDING MODE --- */}
            {mode === 'building' && (
              <>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">施設の種類</label>
                  <div className="relative">
                    <select
                      value={selectedBuildingId}
                      onChange={(e) => {
                        setSelectedBuildingId(e.target.value);
                        setSelectedLevel(1); 
                      }}
                      className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                    >
                      {BUILDINGS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">強化後のレベル (目標)</label>
                  <div className="relative">
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                      className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                    >
                      {selectedBuilding.levels.map((l) => (
                        <option key={l.level} value={l.level}>
                          Lv. {l.level} (上昇値: {l.powerIncrease.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* --- RESEARCH MODE (Manual) --- */}
            {mode === 'research' && (
              <div className="md:col-span-2 space-y-3">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">総力の上昇値</label>
                  <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded whitespace-nowrap">手動入力モード</span>
                </div>
                <div className="relative">
                  <CompositionInput
                    placeholder="例: 12000"
                    value={manualPowerStr}
                    onFocus={handleFocus}
                    onChange={handleFormattedChange(setManualPowerStr)}
                    className="w-full bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-12 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-inner transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">
                    UP
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  研究完了時に増加する戦力値を入力してください
                </p>
              </div>
            )}

            {/* --- TROOP MODE (Training/Promotion) --- */}
            {mode === 'troop' && (
              <div className="md:col-span-2 space-y-6">
                
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex gap-3 text-sm text-rose-200 shadow-inner">
                    <Info className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    <p className="leading-relaxed break-keep">
                        兵士訓練/昇格によるポイントは<br /> <span className="font-bold text-white">訓練の日 ＞ 総力UP ＞ 加速消費の日</span> と基本的になってるので、<br />加速は<span className="font-bold text-white underline decoration-rose-500 underline-offset-4 mx-1">訓練の日</span>に使い切りましょう。
                    </p>
                </div>
                
                {/* Troop Sub-Mode Toggle */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <button
                    onClick={() => setTroopSubMode('train')}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                      troopSubMode === 'train' 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-100' 
                        : 'border-slate-700 bg-[#1E293B] text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    訓練 (新規作成)
                  </button>
                  <button
                    onClick={() => setTroopSubMode('promote')}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap ${
                      troopSubMode === 'promote' 
                        ? 'border-rose-500 bg-rose-500/10 text-rose-100' 
                        : 'border-slate-700 bg-[#1E293B] text-slate-500 hover:border-slate-600'
                    }`}
                  >
                    <ChevronsUp className="w-4 h-4" />
                    昇格 (レベルアップ)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                  
                  {troopSubMode === 'promote' && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400">元のレベル (昇格前)</label>
                      <select
                        value={troopSourceLevel}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTroopSourceLevel(val);
                          // Ensure target is always higher
                          if (val >= troopTargetLevel) setTroopTargetLevel(Math.min(10, val + 1));
                        }}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                      >
                        {TROOP_DATA.slice(0, 9).map((t) => (
                          <option key={t.level} value={t.level}>Lv.{t.level} {t.name} (総力: {t.power})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`space-y-2 ${troopSubMode === 'train' ? 'md:col-span-2' : ''}`}>
                    <label className="text-xs font-semibold text-slate-400">
                      {troopSubMode === 'train' ? '訓練する兵士のレベル' : '目標レベル (昇格後)'}
                    </label>
                    <select
                      value={troopTargetLevel}
                      onChange={(e) => setTroopTargetLevel(parseInt(e.target.value))}
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-3 text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {TROOP_DATA.filter(t => troopSubMode === 'train' || t.level > troopSourceLevel).map((t) => (
                        <option key={t.level} value={t.level}>Lv.{t.level} {t.name} (総力: {t.power})</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-semibold text-slate-400">
                      {troopSubMode === 'train' ? '訓練人数' : '昇格させる人数'}
                    </label>
                    <div className="relative">
                      <CompositionInput
                        placeholder="例: 1000"
                        value={troopCount}
                        onFocus={handleFocus}
                        onChange={handleFormattedChange(setTroopCount)}
                        className="w-full bg-[#1E293B] border border-slate-700 rounded-lg pl-4 pr-12 py-3 font-mono text-lg text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">人</span>
                    </div>
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="text-center text-sm text-slate-400">
                  {troopSubMode === 'train' ? (
                     <span>総力 {TROOP_DATA.find(t => t.level === troopTargetLevel)?.power} × {parseInt(troopCount.replace(/,/g, '') || '0').toLocaleString()}人</span>
                  ) : (
                    <span>(目標 {TROOP_DATA.find(t => t.level === troopTargetLevel)?.power} - 元 {TROOP_DATA.find(t => t.level === troopSourceLevel)?.power}) × {parseInt(troopCount.replace(/,/g, '') || '0').toLocaleString()}人</span>
                  )}
                  <span className="mx-2">=</span>
                  <span className="text-rose-400 font-bold text-lg">+{powerIncrease.toLocaleString()} 総力UP</span>
                </div>
              </div>
            )}
          </div>

          {/* Threshold Banner (For Speedup vs Power comparison mainly, not shown in Troop Mode) */}
          {powerIncrease > 0 && mode !== 'troop' && (
            <div className={`mt-8 p-0.5 rounded-xl bg-gradient-to-r ${mode === 'research' ? 'from-purple-500/50 to-blue-500/50' : 'from-amber-500/50 to-blue-500/50'} relative overflow-hidden group shadow-lg`}>
              <div className="absolute inset-0 bg-white/5 blur-xl group-hover:bg-white/10 transition-colors"></div>
              <div className="relative bg-[#0F172A] rounded-[10px] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                
                <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-start">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                    <Timer className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  
                  {mode === 'research' ? (
                     <div className="text-left flex flex-col gap-3">
                        <div>
                           <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-purple-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">研究の日 (45倍)</span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">の境目</span>
                           </div>
                           <div className="text-2xl font-black text-white font-mono tracking-tight leading-none">
                              {formatThresholdTime(thresholdResearch)}
                           </div>
                        </div>
                        <div className="relative pl-3 border-l-2 border-slate-700">
                           <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">総力UP (30倍)</span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">の境目</span>
                           </div>
                           <div className="text-xl font-bold text-slate-300 font-mono tracking-tight leading-none">
                              {formatThresholdTime(thresholdStandard)}
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="text-left">
                        <div className="flex items-center gap-2 mb-0.5">
                           <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">お得ライン (境目)</span>
                           <span className="bg-slate-700 text-[10px] px-1.5 py-0.5 rounded text-slate-300 whitespace-nowrap hidden sm:inline-block">入力不要で確認可能</span>
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight leading-none">
                           {formatThresholdTime(thresholdStandard)}
                        </div>
                     </div>
                  )}
                </div>

                <div className="text-center md:text-right w-full md:w-auto bg-white/5 md:bg-transparent p-3 md:p-0 rounded-lg">
                  <div className="flex flex-col items-center md:items-end gap-0.5">
                    <p className="text-xs md:text-sm text-slate-300 leading-snug break-keep">
                      残り時間がこれより<span className={`${mode === 'research' ? 'text-white' : 'text-amber-400'} font-bold text-sm md:text-base mx-1`}>短ければ</span>{mode === 'research' ? '各イベント' : '総力UP'}！
                    </p>
                    <p className="text-xs md:text-sm text-slate-300 leading-snug break-keep">
                      <span className="text-blue-400 font-bold text-sm md:text-base mr-1">長ければ</span>加速消費推奨
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Input */}
          <div className={`pt-8 border-t border-white/5 ${powerIncrease > 0 ? 'mt-8' : 'mt-8'}`}>
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 block">残り時間 (加速する時間)</label>
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {[
                { label: '日', value: days, setter: setDays },
                { label: '時間', value: hours, setter: setHours },
                { label: '分', value: minutes, setter: setMinutes }
              ].map((field, idx) => (
                <div key={idx} className="relative">
                  <CompositionInput
                    value={field.value}
                    onFocus={handleFocus}
                    onChange={handleSimpleNumericChange(field.setter)}
                    className="w-full bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-12 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-inner transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{field.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 items-baseline gap-2">
              <span className="text-slate-400 text-sm">合計時間:</span>
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {currentTotalMinutes.toLocaleString()} 
                <span className="text-base font-normal text-slate-500 ml-1">分</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Verdict Card */}
        <div className={`relative overflow-hidden rounded-2xl p-1 transition-all duration-500 shadow-2xl group ${
            recommendation === RecommendationType.ACCELERATE_NOW ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
            recommendation === RecommendationType.WAIT_FOR_SPEEDUP ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
            recommendation === RecommendationType.WAIT_FOR_TRAINING ? 'bg-gradient-to-br from-rose-500 to-pink-600' :
            recommendation === RecommendationType.WAIT_FOR_RESEARCH ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600' :
            'bg-slate-800'
          }`}>
          <div className="h-full bg-[#0F172A] rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute top-0 left-0 w-full h-full opacity-20 blur-3xl transition-colors duration-500 ${
              recommendation === RecommendationType.ACCELERATE_NOW ? 'bg-amber-500' :
              recommendation === RecommendationType.WAIT_FOR_SPEEDUP ? 'bg-blue-500' :
              recommendation === RecommendationType.WAIT_FOR_TRAINING ? 'bg-rose-500' :
              recommendation === RecommendationType.WAIT_FOR_RESEARCH ? 'bg-purple-500' :
              'bg-transparent'
            }`}></div>

            {currentTotalMinutes > 0 || (powerIncrease > 0 && mode !== 'building') ? (
              <div className="relative z-10 w-full space-y-6">
                <div className="inline-block">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 bg-slate-800/50 px-4 py-1.5 rounded-full backdrop-blur">
                    Best Strategy
                  </h3>
                </div>
                
                {recommendation === RecommendationType.ACCELERATE_NOW && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50">
                      <Zap className="w-12 h-12 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight break-keep">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">総力UP</span>で<br/>加速！
                    </div>
                    <p className="text-amber-200/80 font-medium text-lg mb-8 break-keep">
                      {modeInfo[mode].label}ポイントデーが最適です
                    </p>
                  </div>
                )}
                
                {recommendation === RecommendationType.WAIT_FOR_SPEEDUP && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50">
                      <Clock className="w-12 h-12 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight break-keep">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-500">加速消費</span>まで<br/>待機
                    </div>
                    <p className="text-blue-200/80 font-medium text-lg mb-8 break-keep">金曜日まで温存しましょう</p>
                  </div>
                )}

                {recommendation === RecommendationType.WAIT_FOR_TRAINING && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-rose-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/50">
                      <Trophy className="w-12 h-12 text-rose-400 drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]" />
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight break-keep">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-rose-300 to-rose-500">兵士訓練</span>まで<br/>待機
                    </div>
                    <p className="text-rose-200/80 font-medium text-lg mb-8 break-keep">「訓練の日」が最もポイントを稼げます</p>
                  </div>
                )}

                {recommendation === RecommendationType.WAIT_FOR_RESEARCH && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/50">
                      <Microscope className="w-12 h-12 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg leading-tight break-keep">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-purple-300 to-purple-500">研究の日</span>まで<br/>待機
                    </div>
                    <p className="text-purple-200/80 font-medium text-lg mb-8 break-keep">1戦力45ptの日が最も高効率です</p>
                  </div>
                )}
                
                {recommendation === RecommendationType.EQUAL && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-12 h-12 text-slate-400" />
                    </div>
                    <div className="text-4xl font-bold text-slate-200 mb-3 break-keep">どちらでも同じ</div>
                    <p className="text-slate-400 break-keep">獲得ポイントは同等です</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center py-10">
                <CalcIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium tracking-wide">データを入力して分析を開始</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              詳細データ比較
            </h3>
            <div className="space-y-5">
              
              {/* Efficiency Comparison Section */}
              <div className="group bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-300 font-semibold">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  時間効率 (1分あたりの獲得Pt)
                </div>
                
                {/* Event 1 Efficiency */}
                <div className="flex justify-between items-center mb-2">
                   <span className="text-slate-400 text-xs">総力UP (戦力30/20pt)</span>
                   <span className={`text-base font-bold font-mono ${efficiencyEvent1 > 300 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {Math.round(efficiencyEvent1).toLocaleString()} <span className="text-[10px]">pt/分</span>
                   </span>
                </div>
                
                {/* Event 3 Efficiency (Troop Only) */}
                {mode === 'troop' && (
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-400 text-xs">兵士訓練の日</span>
                     <span className={`text-base font-bold font-mono ${efficiencyEvent3 > 300 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {Math.round(efficiencyEvent3).toLocaleString()} <span className="text-[10px]">pt/分</span>
                     </span>
                  </div>
                )}

                {/* Event 4 Efficiency (Research Only) */}
                {mode === 'research' && (
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-400 text-xs">研究の日 (戦力45pt)</span>
                     <span className={`text-base font-bold font-mono ${efficiencyEvent4 > 300 ? 'text-purple-400' : 'text-slate-500'}`}>
                        {Math.round(efficiencyEvent4).toLocaleString()} <span className="text-[10px]">pt/分</span>
                     </span>
                  </div>
                )}

                {/* Speedup Event Efficiency (Fixed) */}
                <div className="flex justify-between items-center mb-2 pt-2 border-t border-white/5 mt-2">
                   <span className="text-slate-400 text-xs">加速消費デー (固定)</span>
                   <span className="text-base font-bold font-mono text-blue-400">
                      300 <span className="text-[10px]">pt/分</span>
                   </span>
                </div>
              </div>

              <div className="group p-3 -mx-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">入力された残り時間</span>
                  <span className={`text-xl font-bold font-mono text-white`}>
                    {currentTotalMinutes.toLocaleString()} <span className="text-xs text-slate-500">分</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison Chart */}
          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="h-40 w-full">
               <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                 <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 0, right: 90, left: 0, bottom: 0 }} 
                    barSize={20}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={120} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                      axisLine={false} 
                      tickLine={false} 
                      interval={0}
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      formatter={(value: number) => [value.toLocaleString() + ' pts', '獲得ポイント']}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="points" radius={[0, 4, 4, 0]} animationDuration={1000}>
                      <LabelList 
                        dataKey="points" 
                        content={(props: any) => {
                          const { x, y, width, height, value, index } = props;
                          const fill = chartData[index]?.fill || '#fff';
                          return (
                            <text 
                              x={x + width + 8} 
                              y={y + height / 2 + 1} 
                              fill={fill} 
                              stroke="none"
                              fontSize={14} 
                              fontWeight="bold"
                              fontFamily="monospace"
                              dominantBaseline="middle"
                            >
                              {Number(value).toLocaleString()}
                            </text>
                          );
                        }}
                      />
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} strokeWidth={1} fillOpacity={0.8} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-blue-900/20 rounded-xl p-4 border border-blue-500/20 text-sm text-blue-200/80 backdrop-blur-sm">
        <div className="shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-blue-300">計算ロジックと戦略メモ</h4>
          <p className="mb-2 break-keep">
            境目となる時間（分） = 上昇する総力 × (イベント倍率 ÷ 300) <br/>
            通常建造・研究は倍率30、兵士は倍率20、<strong>研究の日</strong>は倍率45で計算されます。
          </p>
          {mode === 'troop' && (
            <p className="text-rose-200/90 font-medium bg-rose-900/30 p-2 rounded border border-rose-500/30 break-keep">
              ⚡ <strong>兵士イベントのヒント:</strong><br/>
              兵士イベントは「訓練の日」と「総力UPの日」の2種類でポイント獲得機会があります。<br/>
              上記グラフでポイントが高い日を狙って加速を使いましょう。<br/>
              ※一般的に低レベル兵士は「訓練の日」の効率が良く、高レベル兵士は「総力UPの日」が競合する場合があります。
            </p>
          )}
          {mode === 'research' && (
            <p className="text-purple-200/90 font-medium bg-purple-900/30 p-2 rounded border border-purple-500/30 break-keep">
              ⚡ <strong>研究イベントのヒント:</strong><br/>
              研究は「総力UP（30倍）」よりも「研究の日（45倍）」の方が圧倒的にポイント効率が良いです。<br/>
              急ぎでない場合は、研究の日に加速を使用することを強く推奨します。
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
