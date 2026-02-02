
import React, { useState, useMemo, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { MOBILIZATION_QUESTS, LORD_EQUIPMENT_SCORES, LORD_GEM_SCORES } from '../constants';
import { 
  IconSpeedupGeneral, 
  IconSpeedupTroop, 
  IconSpeedupBuilding, 
  IconSpeedupResearch, 
  IconDiamonds, 
  IconHeroGear, 
  IconHeroShards, 
  IconWildBeast, 
  IconGathering,
  IconMeatBone,
  IconGiantBeast,
  IconPackPurchase
} from './QuestIcons';
import { Timer, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Clock, ArrowDown, Zap, Calculator, ChevronDown, ChevronUp, BarChart3, Coins, Pickaxe, BookOpen, Lightbulb, Target, Camera, Loader2, Info, ArrowUpCircle, Lock, CreditCard, Table, Swords, Shield, Gem, HelpCircle, X } from 'lucide-react';

// Type definitions for user inventory
interface Inventory {
  speedup_general_mins: number;
  speedup_troop_mins: number;
  speedup_building_mins: number;
  speedup_research_mins: number;
  diamonds: number;
  hammer: number;
  hero_shards: number;
  stamina: number;
}

// Helper to convert full-width numbers to half-width
const normalizeInput = (str: string) => {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

// Specific handler for time inputs
const TimeInput = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon,
  colorClass 
}: { 
  label: string, 
  value: number, 
  onChange: (mins: number) => void,
  icon: any,
  colorClass?: string
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toLocaleString());
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
       setLocalValue(value === 0 ? '' : value.toLocaleString());
    }
  }, [value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    
    if (!isComposing) {
        const normalized = normalizeInput(raw);
        const val = parseInt(normalized.replace(/[^0-9]/g, ''));
        onChange(isNaN(val) ? 0 : val);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const normalized = normalizeInput(e.currentTarget.value);
    const val = parseInt(normalized.replace(/[^0-9]/g, ''));
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
       <div className="flex items-center gap-2">
         {Icon && <Icon className={`w-8 h-8 ${colorClass}`} />}
         <label className={`block text-xs font-bold uppercase text-slate-300 break-all`}>{label}</label>
       </div>
       <div className="relative w-32">
          <input 
            type="text" 
            inputMode="numeric"
            placeholder="0" 
            value={localValue} 
            onChange={handleChange}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={handleCompositionEnd}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-right text-sm text-white focus:ring-1 focus:ring-slate-500 outline-none font-mono"
            onFocus={(e) => e.target.select()}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">分</span>
       </div>
    </div>
  );
};

// Unified Resource Input Component
const ResourceInput = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  iconColor, 
  iconBg,
  unit
}: { 
  label: string, 
  value: number, 
  onChange: (val: string) => void,
  icon: any,
  iconColor: string,
  iconBg: string,
  unit?: string
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toLocaleString());
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
       setLocalValue(value === 0 ? '' : value.toLocaleString());
    }
  }, [value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    if (!isComposing) {
        const normalized = normalizeInput(raw);
        onChange(normalized);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const normalized = normalizeInput(e.currentTarget.value);
    onChange(normalized);
  };

  return (
    <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-xl border border-slate-700 group hover:border-slate-500 transition-colors">
       <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
       </div>
       <div className="flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase block mb-0.5 break-all">{label}</label>
          <div className="relative">
             <input 
               type="text" 
               inputMode="numeric"
               placeholder="0"
               value={localValue}
               onChange={handleChange}
               onCompositionStart={() => setIsComposing(true)}
               onCompositionEnd={handleCompositionEnd}
               className="w-full bg-transparent text-white font-mono text-lg outline-none placeholder:text-slate-600 appearance-none z-10 relative"
               onFocus={(e) => e.target.select()}
             />
             {unit && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none font-sans">{unit}</span>}
          </div>
       </div>
    </div>
  );
};

// --- ALGORITHM TYPES ---
interface QuestVariant {
  type: string;
  rank: string;
  cost: number;
  points: number;
  questLabel: string;
  unit: string;
  resourceKey: keyof Inventory; // Helper to know which resource to deduct
  icon: any;
  color: string;
  efficiency: number; // Cost per Point
}

interface BreakdownItem {
  id: string;
  label: string;
  questCount: number;
  points: number;
  details: string[];
  icon: any;
  color: string;
  unit: string;
}

const MobilizationGuide: React.FC = () => {
  const defaultInventory: Inventory = {
    speedup_general_mins: 0,
    speedup_troop_mins: 0,
    speedup_building_mins: 0,
    speedup_research_mins: 0,
    diamonds: 0,
    hammer: 0,
    hero_shards: 0,
    stamina: 0,
  };

  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const saved = localStorage.getItem('kingshot_mobilization_inventory_v5'); // Updated version key
      return saved ? { ...defaultInventory, ...JSON.parse(saved) } : defaultInventory;
    } catch (e) {
      return defaultInventory;
    }
  });

  // Target Quests State
  const [targetQuests, setTargetQuests] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('kingshot_mobilization_target');
        return saved ? Math.min(69, parseInt(saved)) : 51;
    } catch {
        return 51;
    }
  });

  const [isSimulationOpen, setIsSimulationOpen] = useState(true);
  const [isReferenceTableOpen, setIsReferenceTableOpen] = useState(false);
  const [isImpossibleOpen, setIsImpossibleOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeedupInstructionOpen, setIsSpeedupInstructionOpen] = useState(false);
  
  // State for detail popups in the reference table
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_inventory_v5', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_target', targetQuests.toString());
  }, [targetQuests]);

  const handleInventoryChange = (field: keyof Inventory, value: string) => {
    const normalized = normalizeInput(value);
    const num = parseInt(normalized.replace(/[^0-9]/g, '')) || 0;
    setInventory(prev => ({ ...prev, [field]: num }));
  };

// --- 統計画面（資源と加速統計）専用 OCR解析ロジック（修正版v5: 消去法対応） ---
  const handleSpeedupImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const worker = await createWorker('jpn');
      const ret = await worker.recognize(file);
      const rawText = ret.data.text;
      
      console.log("Raw Text:", rawText);

      // 1. テキストの正規化
      const cleanedText = rawText
        .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字→半角
        .replace(/,/g, '')       // カンマ除去
        .replace(/\s+/g, '')     // スペース・改行除去
        .replace(/l|I|\|/g, '1') // 1の誤読補正
        .replace(/O|o/g, '0');   // 0の誤読補正

      console.log("Cleaned:", cleanedText);

      // 時間変換ヘルパー
      const parseDurationStr = (str: string): number => {
        let totalMins = 0;
        const days = str.match(/(\d+)日/);
        if (days) totalMins += parseInt(days[1]) * 24 * 60;
        const hours = str.match(/(\d+)時間/);
        if (hours) totalMins += parseInt(hours[1]) * 60;
        const mins = str.match(/(\d+)分/);
        if (mins) totalMins += parseInt(mins[1]);
        return totalMins;
      };

      const newValues: any = {};
      let foundCount = 0;

      // 2. まず「訓練」「建造」「研究」を特定（これらはキーワードが強いので確実）
      const specificTargets = [
        { key: 'speedup_troop_mins', keywords: ['訓練'] }, 
        { key: 'speedup_building_mins', keywords: ['建造', '建築', '建設', '建', '造'] },
        { key: 'speedup_research_mins', keywords: ['研究'] },
      ];

      specificTargets.forEach(target => {
        let index = -1;
        for (const kw of target.keywords) {
           index = cleanedText.indexOf(kw);
           if (index !== -1) break;
        }

        if (index !== -1) {
          const textAfterKeyword = cleanedText.substring(index);
          // 数字+単位のセットを探す
          const timeMatch = textAfterKeyword.match(/(\d+(?:日|時間|分))+/);
          
          if (timeMatch && timeMatch[0].length > 0) {
             const minutes = parseDurationStr(timeMatch[0]);
             if (minutes > 0) {
                newValues[target.key] = minutes; 
                foundCount++;
             }
          }
        }
      });

      // 3. 【一般加速の特定ロジック変更】
      const exclusionChars = ['練', '造', '築', '建', '究', '療', 'と']; // 除外する直前文字
      const keyword = '加速';
      
      let searchPos = 0;
      while (searchPos < cleanedText.length) {
          const index = cleanedText.indexOf(keyword, searchPos);
          if (index === -1) break; // もう「加速」がない

          // 直前の文字を確認
          const prevChar = index > 0 ? cleanedText.charAt(index - 1) : '';
          
          // 除外リストに含まれていなければ、これが「一般加速」の可能性大
          if (!exclusionChars.includes(prevChar)) {
              const textAfter = cleanedText.substring(index + keyword.length);
              
              // すぐ後ろに「数字+単位」があるか確認
              // ※ タブ名の「加速」などは後ろに数字がないのでここで弾かれる
              const timeMatch = textAfter.match(/^.*?(\d+(?:日|時間|分))+/);
              
              if (timeMatch) {
                  const realTimePart = timeMatch[0].match(/(\d+(?:日|時間|分))+/);
                  if (realTimePart) {
                      const minutes = parseDurationStr(realTimePart[0]);
                      if (minutes > 0) {
                          newValues['speedup_general_mins'] = minutes;
                          foundCount++;
                          break; // 一般加速が見つかったらループ終了
                      }
                  }
              }
          }
          
          searchPos = index + 1; // 次の「加速」を探す
      }

      if (foundCount === 0) {
        alert("数値を読み取れませんでした。\n画像の文字が鮮明か確認してください。");
      } else {
        setInventory(prev => ({
          ...prev,
          ...newValues
        }));
      }

      await worker.terminate();

    } catch (err) {
      console.error("OCR Error:", err);
      alert("解析エラー: " + err);
    } finally {
      setIsAnalyzing(false);
      e.target.value = '';
    }
  };
  
  // --- HELPER: Quest Definitions ---
  // Maps constants to a flatter structure for the algorithm
  const availableQuestVariants = useMemo(() => {
    const variants: QuestVariant[] = [];
    
    // Mapping Quest Types to Resource Keys and Icons
    // Note: IconWildBeast is still used here for the quest listing as requested
    const mapTypeToResource: Record<string, { key: keyof Inventory, icon: any, color: string, unit: string }> = {
       'speedup_general': { key: 'speedup_general_mins', icon: IconSpeedupGeneral, color: 'text-sky-400', unit: '分' },
       'speedup_troop': { key: 'speedup_troop_mins', icon: IconSpeedupTroop, color: 'text-rose-400', unit: '分' },
       'speedup_building': { key: 'speedup_building_mins', icon: IconSpeedupBuilding, color: 'text-amber-400', unit: '分' },
       'speedup_research': { key: 'speedup_research_mins', icon: IconSpeedupResearch, color: 'text-blue-400', unit: '分' },
       'diamonds': { key: 'diamonds', icon: IconDiamonds, color: 'text-cyan-400', unit: '個' },
       'hammer': { key: 'hammer', icon: IconHeroGear, color: 'text-purple-400', unit: '個' },
       'hero_shards': { key: 'hero_shards', icon: IconHeroShards, color: 'text-orange-400', unit: '個' },
       'wild_beast': { key: 'stamina', icon: IconWildBeast, color: 'text-amber-700', unit: '体力' },
       // Note: Training, Equip, Gem removed from calculation map
    };

    MOBILIZATION_QUESTS.forEach(q => {
       const info = mapTypeToResource[q.type];
       if (!info) return;

       q.variants.forEach(v => {
          variants.push({
             type: q.type,
             questLabel: q.label,
             rank: v.rank,
             cost: v.cost,
             points: v.points,
             resourceKey: info.key,
             icon: info.icon,
             color: info.color,
             unit: info.unit,
             efficiency: v.cost / v.points // Lower is better resource efficiency (Blue)
          });
       });
    });

    return variants;
  }, []);

  // --- CORE ALGORITHM: Simulation ---
  const calculatePlan = (target: number, currentInventory: Inventory) => {
      // 1. Group variants by Type (e.g. "Building Speedup")
      const groupedVariants: Record<string, QuestVariant[]> = {};
      availableQuestVariants.forEach(v => {
          if (!groupedVariants[v.type]) groupedVariants[v.type] = [];
          groupedVariants[v.type].push(v);
      });
      
      // Sort each group by Points ASC (Blue -> Purple -> Yellow)
      Object.keys(groupedVariants).forEach(key => {
          groupedVariants[key].sort((a, b) => a.points - b.points);
      });

      // 2. Initial Pass: Fill with Cheapest (Blue) to ensure we hit Target count
      let selectedQuests: QuestVariant[] = [];
      let tempInv = { ...currentInventory };
      
      // Helper to check/deduct cost
      const canAfford = (v: QuestVariant, inv: Inventory): boolean => {
          let needed = v.cost;
          let available = inv[v.resourceKey];
          
          // Speedup Logic: Use specific first, then general
          if (v.type.startsWith('speedup_') && v.type !== 'speedup_general') {
              if (available >= needed) return true;
              needed -= available;
              return inv.speedup_general_mins >= needed;
          }
          return available >= needed;
      };

      const deduct = (v: QuestVariant, inv: Inventory) => {
          let needed = v.cost;
          
          if (v.type.startsWith('speedup_') && v.type !== 'speedup_general') {
             const specific = inv[v.resourceKey];
             const usedSpecific = Math.min(specific, needed);
             inv[v.resourceKey] -= usedSpecific;
             needed -= usedSpecific;
             if (needed > 0) {
                 inv.speedup_general_mins -= needed;
             }
          } else {
             inv[v.resourceKey] -= needed;
          }
      };
      
      while (selectedQuests.length < target) {
          let candidates: QuestVariant[] = [];
          
          Object.values(groupedVariants).forEach(variants => {
              // The first one is the cheapest (Blue)
              const cheap = variants[0];
              if (canAfford(cheap, tempInv)) {
                  candidates.push(cheap);
              }
          });

          if (candidates.length === 0) break; 
          
          const chosen = candidates[0]; 
          deduct(chosen, tempInv);
          selectedQuests.push(chosen);
      }
      
      const maxReachedCount = selectedQuests.length;

      // 3. Optimization Pass: Upgrade to maximize Points
      selectedQuests.sort((a, b) => a.points - b.points);

      for (let i = 0; i < selectedQuests.length; i++) {
          const current = selectedQuests[i];
          const variants = groupedVariants[current.type];
          
          for (let j = variants.length - 1; j >= 0; j--) {
              const upgrade = variants[j];
              if (upgrade.points <= current.points) break; 
              
              const diff = upgrade.cost - current.cost;
              const diffVariant = { ...upgrade, cost: diff };
              
              if (canAfford(diffVariant, tempInv)) {
                  deduct(diffVariant, tempInv);
                  selectedQuests[i] = upgrade; // Swap
                  break; // Move to next quest
              }
          }
      }

      // Calculate totals
      const totalPoints = selectedQuests.reduce((sum, q) => sum + q.points, 0);
      
      // Generate Breakdown
      const breakdown: BreakdownItem[] = [];
      const groupedResult: Record<string, { count: number, points: number, details: string[], icon: any, color: string, label: string, unit: string }> = {};
      
      selectedQuests.forEach(q => {
          if (!groupedResult[q.resourceKey]) {
              groupedResult[q.resourceKey] = { 
                  count: 0, 
                  points: 0, 
                  details: [], 
                  icon: q.icon, 
                  color: q.color, 
                  label: q.questLabel.split('(')[0], // Simple label
                  unit: q.unit
              };
          }
          groupedResult[q.resourceKey].count++;
          groupedResult[q.resourceKey].points += q.points;
          groupedResult[q.resourceKey].details.push(q.rank);
      });

      Object.entries(groupedResult).forEach(([key, data]) => {
          const counts = data.details.reduce((acc, curr) => { acc[curr] = (acc[curr]||0)+1; return acc; }, {} as Record<string, number>);
          const detailStr = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) 
            .map(([rank, count]) => `${rank}×${count}`)
            .join(', ');

          breakdown.push({
              id: key,
              label: data.label,
              questCount: data.count,
              points: data.points,
              details: [detailStr],
              icon: data.icon,
              color: data.color,
              unit: data.unit
          });
      });

      return { totalPoints, totalQuests: maxReachedCount, breakdown, remaining: tempInv };
  };

  // --- MAIN SIMULATION ---
  const simulation = useMemo(() => {
      return calculatePlan(targetQuests, inventory);
  }, [inventory, targetQuests]);

  // --- COST CALCULATION HELPER ---
  const calculateEventCost = (target: number) => {
    const INITIAL_QUESTS = 9;
    const EVENT_DAYS = 6;
    const needed = Math.max(0, target - INITIAL_QUESTS);
    
    if (needed === 0) return { totalCost: 0, details: ['初期回数(9)以下なので購入不要'] };

    const basePerDay = Math.floor(needed / EVENT_DAYS);
    const remainder = needed % EVENT_DAYS;
    
    // Function to calculate cost for N quests in a single day
    const calculateDailyCost = (n: number) => {
        let c = 0;
        for (let i = 1; i <= n; i++) {
            if (i === 1) c += 0;
            else if (i <= 4) c += 50;
            else if (i <= 7) c += 200;
            else c += 1000;
        }
        return c;
    };

    const costBase = calculateDailyCost(basePerDay);
    const costPlus = calculateDailyCost(basePerDay + 1);
    
    const totalCost = (costPlus * remainder) + (costBase * (EVENT_DAYS - remainder));
    
    let details = [];
    if (basePerDay > 0 || remainder > 0) {
        if (remainder === 0) {
            details.push(`1日 ${basePerDay}個追加 × ${EVENT_DAYS}日間`);
        } else {
            details.push(`${remainder}日間は ${basePerDay + 1}個`);
            details.push(`${EVENT_DAYS - remainder}日間は ${basePerDay}個`);
        }
    }
    
    return { totalCost, details };
  };

  // --- SUGGESTION LOGIC ---
  const suggestion = useMemo(() => {
      if (simulation.totalQuests < targetQuests) return null;
      if (targetQuests >= 51) return null;

      const NEXT_TARGET = 51;
      const maxPlan = calculatePlan(NEXT_TARGET, inventory);
      
      if (maxPlan.totalQuests > simulation.totalQuests) {
          const pointDiff = maxPlan.totalPoints - simulation.totalPoints;
          const countDiff = maxPlan.totalQuests - simulation.totalQuests;
          
          const currentCost = calculateEventCost(targetQuests).totalCost;
          const nextCost = calculateEventCost(NEXT_TARGET).totalCost;
          const additionalCost = nextCost - currentCost;
          
          if (pointDiff > 500) { 
              return {
                  newTarget: NEXT_TARGET,
                  pointGain: pointDiff,
                  countGain: countDiff,
                  additionalCost: additionalCost
              };
          }
      }
      return null;
  }, [simulation, targetQuests, inventory]);


  // --- Gap Analysis Logic ---
  const gapAnalysis = useMemo(() => {
    const TARGET = targetQuests;
    const current = simulation.totalQuests;
    const missing = Math.max(0, TARGET - current);
    
    const proposals = [
        {
            type: 'giant_beast',
            label: '巨獣討伐(集結/10回)',
            icon: IconGiantBeast,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            pointsPerQuest: 300, 
            desc: '集結参加なら体力消費なしで回数稼ぎ'
        },
        {
            type: 'grind',
            label: '資源採集(30M)',
            icon: IconGathering,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            pointsPerQuest: 240, 
            desc: '時間はかかりますが無料で無限に可能'
        },
        {
            type: 'pay',
            label: 'パック購入(2500pt)',
            icon: IconPackPurchase,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            pointsPerQuest: 240, 
            desc: '約610円のパック購入で即達成可能'
        }
    ];

    return { missing, proposals };
  }, [simulation.totalQuests, targetQuests]);


  // --- Cost Calculation Logic (Daily Reset) ---
  const costAnalysis = useMemo(() => {
      return calculateEventCost(targetQuests);
  }, [targetQuests]);


  // --- List View Logic (Possible/Impossible) ---
  const { possible, impossible } = useMemo(() => {
    let possibleList: any[] = [];
    let impossibleList: any[] = [];

    MOBILIZATION_QUESTS.forEach(questType => {
      // Exclude Gathering, Giant Beast, Charge, Training, Equipment, Gems from budget check
      // (they are either free/time based, paid, or removed from calculation logic)
      if (['gathering', 'giant_beast', 'charge', 'training', 'lord_equip', 'lord_gem'].includes(questType.type)) return;

      let displayLabel = questType.label;
      if (questType.type === 'speedup_general') displayLabel = '一般加速';

      questType.variants.forEach(variant => {
        let availableInv = 0;
        let isPossible = false;
        let unit = questType.unit || '分';
        let Icon = null;
        
        // Define Icon for listing
        if (questType.type === 'speedup_general') Icon = IconSpeedupGeneral;
        else if (questType.type === 'speedup_troop') Icon = IconSpeedupTroop;
        else if (questType.type === 'speedup_building') Icon = IconSpeedupBuilding;
        else if (questType.type === 'speedup_research') Icon = IconSpeedupResearch;
        else if (questType.type === 'diamonds') Icon = IconDiamonds;
        else if (questType.type === 'hammer') Icon = IconHeroGear;
        else if (questType.type === 'hero_shards') Icon = IconHeroShards;
        else if (questType.type === 'wild_beast') Icon = IconWildBeast;
        else Icon = Zap;

        if (questType.category === 'speedup') {
             const general = inventory.speedup_general_mins;
             if (questType.type === 'speedup_troop') availableInv = inventory.speedup_troop_mins + general;
             else if (questType.type === 'speedup_building') availableInv = inventory.speedup_building_mins + general;
             else if (questType.type === 'speedup_research') availableInv = inventory.speedup_research_mins + general;
             else availableInv = general + inventory.speedup_troop_mins + inventory.speedup_building_mins + inventory.speedup_research_mins;
        } else {
            if (questType.type === 'hammer') availableInv = inventory.hammer;
            else if (questType.type === 'diamonds') availableInv = inventory.diamonds;
            else if (questType.type === 'hero_shards') availableInv = inventory.hero_shards;
            else if (questType.type === 'wild_beast') availableInv = inventory.stamina;
        }

        isPossible = availableInv >= variant.cost;
        let efficiencyScore = variant.cost / variant.points;
        
        const item = { 
            ...variant, 
            label: displayLabel, 
            currentInv: availableInv, 
            efficiencyScore, 
            unit,
            icon: Icon
        };

        if (isPossible) possibleList.push(item);
        else impossibleList.push(item);
      });
    });

    const sortFn = (a: any, b: any) => a.efficiencyScore - b.efficiencyScore;
    return { possible: possibleList.sort(sortFn), impossible: impossibleList.sort(sortFn) };
  }, [inventory]);

  const getRankBadgeStyle = (rank: string) => {
      switch (rank) {
          case '黄': return 'bg-yellow-500 text-black border-yellow-400';
          case '紫': return 'bg-purple-600 text-white border-purple-500';
          case '青': return 'bg-blue-600 text-white border-blue-500';
          default: return 'bg-slate-700 text-slate-400 border-slate-600';
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* --- NEW SECTION: Reference Table (MOVED TO TOP) --- */}
           <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-6 relative">
             {/* Overlay for Detail Popup */}
             {openDetailId && (
               <>
                 {/* Transparent Fixed Overlay for Click-Out */}
                 <div 
                   className="fixed inset-0 z-40 bg-transparent"
                   onClick={() => setOpenDetailId(null)}
                 />
                 {/* Positioned Popup (Smaller, near items) */}
                 <div 
                   className="absolute z-50 bottom-12 left-1/2 transform -translate-x-1/2 w-72 max-h-96 bg-[#1E293B] border border-slate-600 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                   onClick={(e) => e.stopPropagation()}
                 >
                   <div className="p-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 shrink-0">
                     <h4 className="font-bold text-white text-xs flex items-center gap-2">
                       <Info className="w-3.5 h-3.5 text-indigo-400" />
                       {openDetailId === 'lord_equip' ? '領主装備評価ポイント' : '領主宝石評価ポイント'}
                     </h4>
                     <button onClick={() => setOpenDetailId(null)} className="text-slate-400 hover:text-white transition-colors">
                       <X className="w-4 h-4" />
                     </button>
                   </div>
                   <div className="overflow-y-auto p-0">
                     <table className="w-full text-xs">
                       <thead className="bg-slate-800/80 sticky top-0">
                         <tr>
                           <th className="p-2 text-left font-bold text-slate-400">{openDetailId === 'lord_equip' ? '装備ランク' : '宝石レベル'}</th>
                           <th className="p-2 text-right font-bold text-slate-400">評価スコア</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700/50">
                         {openDetailId === 'lord_equip' ? (
                           LORD_EQUIPMENT_SCORES.map((item, idx) => (
                             <tr key={idx} className="hover:bg-white/5">
                               <td className="p-2 text-slate-300">{item.rank}</td>
                               <td className="p-2 text-right font-mono font-bold text-white">{item.score.toLocaleString()}</td>
                             </tr>
                           ))
                         ) : (
                           LORD_GEM_SCORES.map((item, idx) => (
                             <tr key={idx} className="hover:bg-white/5">
                               <td className="p-2 text-slate-300">{item.level}</td>
                               <td className="p-2 text-right font-mono font-bold text-white">{item.score.toLocaleString()}</td>
                             </tr>
                           ))
                         )}
                       </tbody>
                     </table>
                   </div>
                 </div>
               </>
             )}

             <button
               onClick={() => setIsReferenceTableOpen(!isReferenceTableOpen)}
               className="w-full p-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800/80 transition-colors text-left group"
             >
               <div className="flex items-center gap-3">
                 <Table className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                 <span className="text-base font-bold text-slate-200">クエストポイント早見表</span>
               </div>
               {isReferenceTableOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
             </button>

             {isReferenceTableOpen && (
               <div className="overflow-x-auto p-4 animate-in slide-in-from-top-2 border-t border-white/5">
                 <table className="w-full text-sm border-collapse min-w-[500px]">
                   <thead>
                     <tr className="bg-slate-900 border-b border-slate-700">
                       <th className="p-3 text-left font-bold text-slate-400 w-1/4">項目</th>
                       <th className="p-3 text-center font-bold text-yellow-400 bg-yellow-500/10 w-1/4">黄色</th>
                       <th className="p-3 text-center font-bold text-purple-400 bg-purple-500/10 w-1/4">紫</th>
                       <th className="p-3 text-center font-bold text-blue-400 bg-blue-500/10 w-1/4">青</th>
                     </tr>
                   </thead>
                   <tbody>
                     {MOBILIZATION_QUESTS.map((quest, qIdx) => {
                       // Filter variants by rank for this quest type
                       const yellowVariants = quest.variants.filter(v => v.rank === '黄');
                       const purpleVariants = quest.variants.filter(v => v.rank === '紫');
                       const blueVariants = quest.variants.filter(v => v.rank === '青');
                       
                       const hasDetail = quest.type === 'lord_equip' || quest.type === 'lord_gem';

                       const renderVariantCell = (variants: any[]) => {
                          if (variants.length === 0) return <span className="text-slate-600">-</span>;
                          return (
                            <div className="flex flex-col gap-1 items-center">
                              {variants.map((v, i) => (
                                <div key={i} className="text-xs">
                                  <div className="text-white font-mono font-bold">{v.cost.toLocaleString()} <span className="text-[10px] text-slate-500 font-sans">{quest.unit}</span></div>
                                  <div className={`text-[10px] font-bold ${v.rank === '黄' ? 'text-yellow-600' : v.rank === '紫' ? 'text-purple-500' : 'text-blue-500'}`}>
                                      {v.points > 0 ? `+${v.points}pt` : '不明'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                       };

                       return (
                         <tr key={qIdx} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                           <td className="p-3 text-slate-300 font-bold bg-slate-900/30 relative">
                              <div className="flex items-center gap-2">
                                <span>{quest.label}</span>
                                {hasDetail && (
                                  <button 
                                    onClick={() => setOpenDetailId(quest.type)}
                                    className="text-slate-500 hover:text-indigo-400 transition-colors"
                                  >
                                    <HelpCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div className="text-[9px] text-slate-500 font-normal">{quest.unit}</div>
                           </td>
                           <td className="p-3 text-center bg-yellow-500/5 align-top">
                              {renderVariantCell(yellowVariants)}
                           </td>
                           <td className="p-3 text-center bg-purple-500/5 align-top">
                              {renderVariantCell(purpleVariants)}
                           </td>
                           <td className="p-3 text-center bg-blue-500/5 align-top">
                              {renderVariantCell(blueVariants)}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             )}
           </div>

      {/* Inventory Inputs */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
           今回のイベントでの予算を入力
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 基本アイテム</span>
              </div>
              <ResourceInput
                label="ダイヤ"
                value={inventory.diamonds}
                onChange={v => handleInventoryChange('diamonds', v)}
                icon={IconDiamonds} iconColor="text-cyan-400" iconBg="bg-cyan-500/20" unit="個"
              />
              <ResourceInput
                label="レジェンド英雄の欠片"
                value={inventory.hero_shards}
                onChange={v => handleInventoryChange('hero_shards', v)}
                icon={IconHeroShards} iconColor="text-purple-400" iconBg="bg-purple-500/20" unit="個"
              />
              <ResourceInput
                label="ハンマー (英雄装備)"
                value={inventory.hammer}
                onChange={v => handleInventoryChange('hammer', v)}
                icon={IconHeroGear} iconColor="text-amber-500" iconBg="bg-amber-500/20" unit="個"
              />
              <ResourceInput
                label="体力 (野獣討伐用)"
                value={inventory.stamina}
                onChange={v => handleInventoryChange('stamina', v)}
                icon={IconMeatBone} iconColor="text-rose-400" iconBg="bg-rose-500/20" unit="個"
              />
            </div>

            <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 加速アイテム (分)</span>
                    <label className={`
                        flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border whitespace-nowrap
                        ${isAnalyzing 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
                        }
                    `}>
                        <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSpeedupImageAnalysis}
                        disabled={isAnalyzing}
                        />
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                解析中(OCR)
                            </>
                        ) : (
                            <>
                                <Camera className="w-3 h-3" />
                                画像から自動入力
                            </>
                        )}
                    </label>
                 </div>

                 {/* Check Speedup Time Instruction */}
                 <div className="mb-2">
                    <button 
                        onClick={() => setIsSpeedupInstructionOpen(!isSpeedupInstructionOpen)}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors w-full"
                    >
                        <Info className="w-3 h-3" />
                        <span>総時間の確認方法</span>
                        {isSpeedupInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    {isSpeedupInstructionOpen && (
                        <div className="mt-2 bg-slate-900/50 rounded-lg p-3 border border-white/5 animate-in slide-in-from-top-2">
                            <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium text-slate-400">
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">バッグ</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">加速</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">右上のグラフ</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="text-amber-400">分にチェック</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed breake-all">
                               ※スクショの場合は「日時分」表示のままでも自動計算されます
                            </p>
                        </div>
                    )}
                </div>
                 
                 <TimeInput label="一般加速" colorClass="text-sky-300" icon={IconSpeedupGeneral}
                    value={inventory.speedup_general_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_general_mins: v}))} 
                 />
                 <TimeInput label="兵士訓練加速" colorClass="text-rose-400" icon={IconSpeedupTroop}
                    value={inventory.speedup_troop_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_troop_mins: v}))} 
                 />
                 <TimeInput label="建築加速" colorClass="text-amber-400" icon={IconSpeedupBuilding}
                    value={inventory.speedup_building_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_building_mins: v}))} 
                 />
                 <TimeInput label="研究加速" colorClass="text-blue-400" icon={IconSpeedupResearch}
                    value={inventory.speedup_research_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_research_mins: v}))} 
                 />
            </div>
            
        </div>
      </div>

      {/* Course Guide Section */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-6">
        <button 
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full p-4 flex items-center justify-between bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors text-left group"
        >
            <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-base font-bold text-white">コースの選び方ガイド（初回必見）</span>
            </div>
            {isGuideOpen ? <ChevronUp className="text-indigo-400 w-4 h-4" /> : <ChevronDown className="text-indigo-400 w-4 h-4" />}
        </button>
        
        {isGuideOpen && (
            <div className="p-5 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                {/* Left Panel: Cost Differences */}
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm">
                            <Lightbulb className="w-4 h-4" />
                            コストの違い（ダイヤ消費）
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 mb-2 ml-6">クエスト追加コストの仕組み</h4>
                        <ul className="space-y-2 ml-6 text-xs text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>1個目 : <span className="text-emerald-400 font-bold">無料</span></span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>2〜4個目 : 各<span className="text-amber-400 font-bold">50</span>ダイヤ</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>5〜7個目 : 各<span className="text-amber-400 font-bold">200</span>ダイヤ</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span className="flex items-center gap-2">
                                    8個目〜 : 各<span className="text-rose-400 font-bold">1000</span>ダイヤ
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">非推奨</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="text-emerald-400 font-bold mb-1 text-xs">33回 (節約)</div>
                            <div className="text-[10px] text-slate-400 mb-1 break-all">初期9 + 毎日4個×6日</div>
                            <div className="text-[10px] text-slate-300 font-bold">コスト: 50×3×6 = <span className="text-white">900ダイヤ</span></div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="text-blue-400 font-bold mb-1 text-xs">51回 (完走)</div>
                            <div className="text-[10px] text-slate-400 mb-1 break-all">初期9 + 毎日7個×6日</div>
                            <div className="text-[10px] text-slate-300 font-bold">コスト: 750×6 = <span className="text-white">4,500ダイヤ</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Logic & CP */}
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                            <TrendingUp className="w-4 h-4" />
                            自動計算のロジック & コスパ
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 mb-2 ml-6 flex items-center gap-1">
                            <Info className="w-3 h-3" /> なぜ「青ランク」がお得なのか？
                        </h4>
                        <p className="text-[11px] text-slate-400 ml-6 leading-relaxed mb-4 break-all">
                            黄ランクは1回で大量のポイントを稼げますが、消費アイテム量が莫大です。<br/>
                            青ランクはポイントは控えめですが、消費アイテムが非常に少なく済みます。
                        </p>
                    </div>

                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-slate-800">
                            <div className="p-3 text-center">
                                <div className="text-yellow-500 font-bold text-xs mb-1">黄 : 一般加速</div>
                                <div className="text-[10px] text-slate-400 mb-2">7200分で450pt</div>
                                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">1ptあたり16分消費</div>
                            </div>
                            <div className="p-3 text-center bg-blue-900/10">
                                <div className="text-blue-400 font-bold text-xs mb-1">青 : 一般加速</div>
                                <div className="text-[10px] text-slate-300 mb-2">900分で160pt</div>
                                <div className="text-[10px] text-white font-bold pt-2 border-t border-slate-800/50">1ptあたり5.6分消費</div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-2 text-center text-[10px] font-bold text-emerald-400 border-t border-slate-800 break-all">
                            青ランクの方が圧倒的に低コストでポイントを稼げます！
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* Target Selector */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        
        <div>
           <div className="flex items-center gap-2 mb-4">
             <Target className="w-5 h-5 text-indigo-400" />
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">目標クエスト回数の設定 (最大69回)</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => setTargetQuests(33)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests === 33 
                  ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-2xl font-black ${targetQuests === 33 ? 'text-emerald-400' : 'text-slate-300'}`}>33回</span>
                    {targetQuests === 33 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                 </div>
                 <div className={`text-xs font-bold mb-1 ${targetQuests === 33 ? 'text-emerald-200' : 'text-slate-400'}`}>節約・微課金コース</div>
                 <p className="text-[10px] text-slate-500 leading-snug break-all">
                   コスト約900ダイヤ。<br/>
                   毎日4回追加のペース。
                 </p>
              </button>

              <button 
                onClick={() => setTargetQuests(51)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests === 51 
                  ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50' 
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-2xl font-black ${targetQuests === 51 ? 'text-rose-400' : 'text-slate-300'}`}>51回</span>
                    {targetQuests === 51 && <CheckCircle2 className="w-5 h-5 text-rose-500" />}
                 </div>
                 <div className={`text-xs font-bold mb-1 ${targetQuests === 51 ? 'text-rose-200' : 'text-slate-400'}`}>完走・ガチコース</div>
                 <p className="text-[10px] text-slate-500 leading-snug break-all">
                   コスト約4500ダイヤ。<br/>
                   最大報酬を目指すプラン。
                 </p>
              </button>

              <div className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests !== 33 && targetQuests !== 51
                  ? 'bg-slate-700/30 border-slate-500/50 ring-1 ring-slate-500/50' 
                  : 'bg-slate-800/50 border-white/5'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${targetQuests !== 33 && targetQuests !== 51 ? 'text-white' : 'text-slate-400'}`}>カスタム</span>
                    </div>
                    {(targetQuests !== 33 && targetQuests !== 51) && <CheckCircle2 className="w-5 h-5 text-slate-400" />}
                 </div>
                 <div className="flex items-center gap-2 mt-3">
                    <input 
                      type="number" 
                      min="9" 
                      max="69"
                      value={targetQuests}
                      onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          val = Math.max(9, Math.min(69, val));
                          setTargetQuests(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold text-center outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 shrink-0">回</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex-1">
                 <h4 className="text-white font-bold flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    目標: {targetQuests}回 ／ Max 69回
                 </h4>
                 <p className="text-xs text-slate-400 break-all">
                    現在の予算内で{targetQuests}回を達成できるように、<strong className="text-indigo-300">「青・紫・黄」を自動でミックス</strong>して最大得点を狙います。
                 </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                 <Coins className="w-4 h-4 text-amber-400" />
                 <span className="text-slate-300 break-all">必要枠コスト:</span>
                 <span className="font-bold text-white tabular-nums">{costAnalysis.totalCost.toLocaleString()} ダイヤ</span>
              </div>
           </div>
        </div>
      </div>
      
      {/* Suggestion Banner */}
      {suggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 p-1">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-full shrink-0 animate-pulse">
                          <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-emerald-200">目標回数の引き上げ推奨！</h4>
                          <p className="text-sm text-slate-300 mt-1 leading-snug break-all">
                             現在の予算なら、<span className="text-white font-bold">{suggestion.newTarget}回</span> まで増やしても達成可能です。<br/>
                             これにより、さらに <span className="text-amber-400 font-bold">+{suggestion.pointGain.toLocaleString()}pt</span> 獲得できます。<br/>
                             (追加コスト: <span className="font-bold text-white">{suggestion.additionalCost.toLocaleString()} ダイヤ</span>)
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setTargetQuests(suggestion.newTarget)}
                    className="whitespace-nowrap px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                     目標を{suggestion.newTarget}回に変更
                  </button>
              </div>
          </div>
      )}

      <div className="space-y-6">
           
           {/* Quest Strategy Planner */}
           <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden">
             
             <div 
               className="p-4 sm:p-6 cursor-pointer flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
               onClick={() => setIsSimulationOpen(!isSimulationOpen)}
             >
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                     <BarChart3 className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-white font-bold text-lg sm:text-xl whitespace-nowrap">最適ミックス推奨プラン</h3>
                      <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 whitespace-pre-wrap break-all">
                        {simulation.totalQuests >= targetQuests 
                           ? '目標達成！\nポイント最大化のためにランクを調整済' 
                           : '予算不足により目標未達\n不足分をご確認ください'}
                      </p>
                   </div>
                </div>
                {isSimulationOpen ? <ChevronUp className="text-indigo-300" /> : <ChevronDown className="text-indigo-300" />}
             </div>

             {isSimulationOpen && (
               <div className="bg-[#0B1120]/30 border-t border-indigo-500/20 p-6 animate-in slide-in-from-top-2 duration-300">
                  
                    <div className="space-y-6">

                      {/* Top Summary Stats */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
                            <div className="text-xs text-slate-400 mb-1 z-10 relative">予算で可能な回数</div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1 z-10 relative">
                               {simulation.totalQuests} 
                               <span className="text-sm font-normal text-slate-500">/ {targetQuests}回</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                <div className={`h-full transition-all duration-1000 ${simulation.totalQuests >= targetQuests ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{width: `${Math.min((simulation.totalQuests/targetQuests)*100, 100)}%`}}></div>
                            </div>
                         </div>
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                            <div className="text-xs text-slate-400 mb-1">獲得予定ポイント</div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1">{simulation.totalPoints.toLocaleString()} <span className="text-sm font-normal text-indigo-300">pt</span></div>
                         </div>
                      </div>

                      {/* Gap Recommendation Section */}
                      {gapAnalysis.missing > 0 ? (
                          <div className="bg-slate-900/80 rounded-xl border border-rose-500/30 p-5 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                              
                              <h4 className="text-rose-200 font-bold flex items-center gap-2 mb-4 relative z-10">
                                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                                  目標まであと <span className="text-2xl font-black text-white">{gapAnalysis.missing}</span> 回
                              </h4>
                              
                              <p className="text-xs text-slate-400 mb-4 relative z-10 break-all">
                                  以下のいずれかの方法で不足分の回数を埋めると、{targetQuests}回を達成できます。
                              </p>

                              <div className="grid gap-3 relative z-10">
                                  {gapAnalysis.proposals.map((prop, idx) => (
                                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border bg-slate-950/50 ${prop.border}`}>
                                          <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${prop.bg}`}>
                                                  <prop.icon className={`w-6 h-6 ${prop.color}`} />
                                              </div>
                                              <div>
                                                  <div className={`font-bold text-sm ${prop.color}`}>{prop.label}</div>
                                                  <div className="text-[10px] text-slate-500 break-all">{prop.desc}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-lg font-black text-white">
                                                  × {gapAnalysis.missing}
                                              </div>
                                              <div className="text-[10px] text-slate-400">
                                                  +{gapAnalysis.missing * prop.pointsPerQuest} pts
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                  <h4 className="text-emerald-200 font-bold text-lg">予算のみで目標達成可能です！</h4>
                                  <p className="text-emerald-200/70 text-sm break-all">「青」で回数を確保し、余剰分で「黄・紫」へ自動アップグレードしました。</p>
                              </div>
                          </div>
                      )}

                      {/* Breakdown List */}
                      {simulation.breakdown.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">推奨クエスト内訳</div>
                            {simulation.breakdown.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-indigo-500/10">
                                <div className="flex items-start gap-3">
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                    <div>
                                    <div className={`text-sm font-bold ${item.color} flex items-center gap-2`}>
                                        {item.label}
                                        <span className="text-xs text-white bg-slate-700 px-1.5 rounded">{item.questCount}回</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                        {item.details.map((d, i) => (
                                        <span key={i} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{d}</span>
                                        ))}
                                    </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 pl-8 sm:pl-0">
                                    <div className="text-lg font-bold text-white tabular-nums">
                                    +{item.points.toLocaleString()} pt
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                       残: {simulation.remaining[item.id as keyof Inventory]?.toLocaleString() ?? 0}{item.unit}
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                      )}

                    </div>
               </div>
             )}
           </div>

           {/* Possible Quests List */}
           <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center justify-between">
                 <span>達成可能クエスト一覧</span>
                 <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                    効率順
                 </span>
              </h3>
              
              <div className="space-y-3">
                 {possible.length > 0 ? (
                    possible.map((rec, idx) => {
                       const QuestIcon = rec.icon || Zap;
                       return (
                       <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:translate-x-1 ${
                          rec.rank === '青' ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-900/10' :
                          'bg-slate-800/50 border-slate-700'
                       }`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold text-lg border shadow-inner ${getRankBadgeStyle(rec.rank)}`}>
                                <QuestIcon className="w-8 h-8" />
                             </div>
                             
                             <div>
                                <h4 className={`font-bold text-base ${rec.color} flex items-center gap-2`}>
                                   {rec.label}
                                   <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                      効率: {rec.efficiencyScore.toFixed(1)}
                                   </span>
                                </h4>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                   <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                      コスト: {rec.cost.toLocaleString()}{rec.unit}
                                   </span>
                                   <ArrowRight className="w-3 h-3" />
                                   <span className="text-white font-bold">{rec.points} pt</span>
                                </div>
                             </div>
                          </div>

                          <div className="text-right shrink-0">
                             <div className="text-xs text-slate-500 mb-1">実質予算</div>
                             <div className="text-sm font-mono text-slate-300">
                                {rec.currentInv.toLocaleString()} {rec.unit}
                             </div>
                          </div>
                       </div>
                    )})
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                       <CheckCircle2 className="w-12 h-12 opacity-20" />
                       <p className="text-center text-sm">
                          予算を入力すると、<br/>達成可能なクエストが表示されます。
                       </p>
                    </div>
                 )}
              </div>
           </div>

           {/* Impossible Quests */}
           <div className="bg-[#0F172A]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all">
              <div 
                 className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between select-none"
                 onClick={() => setIsImpossibleOpen(!isImpossibleOpen)}
              >
                 <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider flex items-center gap-3">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> 予算不足クエスト</div>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500">
                       {impossible.length} 件
                    </span>
                 </h3>
                 <div className="text-slate-500">
                   {isImpossibleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </div>
              </div>
              
              {isImpossibleOpen && (
                <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                   {impossible.length > 0 ? (
                      impossible.map((rec, idx) => {
                         const QuestIcon = rec.icon || Zap;
                         return (
                         <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all">
                            <div className="flex items-center gap-4 opacity-60">
                               <div className={`w-10 h-10 rounded flex flex-col items-center justify-center shrink-0 font-bold text-sm border ${getRankBadgeStyle(rec.rank)}`}>
                                  <QuestIcon className="w-6 h-6" />
                                </div>
                               <div>
                                  <h4 className="font-bold text-sm text-slate-400">
                                     {rec.label}
                                  </h4>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                     {rec.points} pt / {rec.cost.toLocaleString()}{rec.unit}
                                  </div>
                               </div>
                            </div>
                            <div className="text-right shrink-0">
                               <div className="text-[10px] text-rose-500/70 font-bold mb-0.5 flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3 h-3" /> 不足
                                </div>
                               <div className="text-xs font-mono text-rose-400">
                                  -{(rec.cost - rec.currentInv).toLocaleString()} {rec.unit}
                                </div>
                            </div>
                         </div>
                      )})
                   ) : (
                      <div className="text-center py-4 text-xs text-slate-600">
                         現在、予算不足のクエストはありません。
                      </div>
                   )}
                </div>
              )}
           </div>

      </div>
    </div>
  );
};

export default MobilizationGuide;
