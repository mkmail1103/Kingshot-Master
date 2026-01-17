
import React, { useState, useMemo, useEffect } from 'react';
import { createWorker } from 'tesseract.js';
import { Shield, Swords, Crosshair, Users, Copy, Check, AlertTriangle, Info, PieChart, ArrowRight, TrendingUp, Percent, Calculator, Camera, Loader2, ChevronDown, ChevronUp } from 'lucide-react';


// -----------------------------------------------------------------------------

// Input helper for comma formatting
const normalizeInput = (str: string) => {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

const FormattedInput = ({
  value,
  onChange,
  label,
  icon: Icon,
  color,
  placeholder,
  subLabel,
  compact = false,
  allowDecimals = false
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
  icon: any;
  color: string;
  placeholder?: string;
  subLabel?: string;
  compact?: boolean;
  allowDecimals?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : (allowDecimals ? value.toString() : value.toLocaleString()));
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
        // Check if the current local value represents the same number as the prop value.
        // If so, do not overwrite (preserves trailing dots, zeros, etc. while typing).
        const rawString = String(localValue).replace(/,/g, '');
        const currentNum = allowDecimals ? parseFloat(rawString) : parseInt(rawString);
        const safeCurrentNum = isNaN(currentNum) ? 0 : currentNum;

        if (safeCurrentNum !== value) {
             setLocalValue(value === 0 ? '' : (allowDecimals ? value.toString() : value.toLocaleString()));
        }
    }
  }, [value, isComposing, allowDecimals]); // Intentionally omitting localValue to avoid loops, purely reactive to prop changes

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    
    if (!isComposing) {
        const normalized = normalizeInput(raw);
        // regex: allow dots if decimals allowed
        const regex = allowDecimals ? /[^0-9.]/g : /[^0-9]/g;
        let clean = normalized.replace(regex, '');

        if (allowDecimals) {
            // Prevent multiple dots
            const parts = clean.split('.');
            if (parts.length > 2) {
                clean = parts[0] + '.' + parts.slice(1).join('');
            }
        }
        
        const val = allowDecimals ? parseFloat(clean) : parseInt(clean);
        onChange(isNaN(val) ? 0 : val);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const raw = e.currentTarget.value;
    const normalized = normalizeInput(raw);
    const regex = allowDecimals ? /[^0-9.]/g : /[^0-9]/g;
    const clean = normalized.replace(regex, '');
    const val = allowDecimals ? parseFloat(clean) : parseInt(clean);
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className={`bg-[#1E293B] border border-slate-700 rounded-xl flex flex-col gap-2 transition-colors hover:border-slate-500 ${compact ? 'p-2' : 'p-3'}`}>
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-slate-800 ${color}`}>
                <Icon className={compact ? "w-3.5 h-3.5" : "w-5 h-5"} />
            </div>
            <div>
                <label className={`block font-bold uppercase text-slate-300 ${compact ? 'text-[10px]' : 'text-xs'}`}>{label}</label>
                {subLabel && <span className="text-[10px] text-slate-500 leading-tight block break-keep">{subLabel}</span>}
            </div>
         </div>
       </div>
       <div className="relative">
          <input 
            type="text" 
            inputMode={allowDecimals ? "decimal" : "numeric"}
            placeholder={placeholder || "0"} 
            value={localValue} 
            onChange={handleChange}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={handleCompositionEnd}
            onFocus={(e) => e.target.select()}
            className={`w-full bg-slate-900 border border-slate-700 rounded-lg text-right font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono placeholder:text-slate-600 ${compact ? 'px-2 py-2 text-sm' : 'px-3 py-3 text-lg'}`}
          />
       </div>
    </div>
  );
};

const TroopRatioCalculator: React.FC = () => {
  // State
  const [myTotal, setMyTotal] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('kingshot_ratio_myTotal') || '0'); } catch { return 0; }
  });
  
  // Enemy Input Mode State - DEFAULT CHANGED TO RATIO
  const [enemyInputMode, setEnemyInputMode] = useState<'count' | 'ratio'>(() => {
    try { 
        const saved = localStorage.getItem('kingshot_ratio_mode');
        return (saved === 'count' || saved === 'ratio') ? saved : 'ratio'; 
    } catch { return 'ratio'; }
  });

  // Direct Count States
  const [enemyShield, setEnemyShield] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('kingshot_ratio_enemyShield') || '0'); } catch { return 0; }
  });
  const [enemySpear, setEnemySpear] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('kingshot_ratio_enemySpear') || '0'); } catch { return 0; }
  });
  const [enemyBow, setEnemyBow] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('kingshot_ratio_enemyBow') || '0'); } catch { return 0; }
  });

  // Ratio Mode States
  const [enemyTotal, setEnemyTotal] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('kingshot_ratio_enemyTotal') || '0'); } catch { return 0; }
  });
  const [ratioShield, setRatioShield] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('kingshot_ratio_ratioShield') || '0'); } catch { return 0; }
  });
  const [ratioSpear, setRatioSpear] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('kingshot_ratio_ratioSpear') || '0'); } catch { return 0; }
  });
  const [ratioBow, setRatioBow] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem('kingshot_ratio_ratioBow') || '0'); } catch { return 0; }
  });

  const [isCopied, setIsCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  // Persistence
  useEffect(() => localStorage.setItem('kingshot_ratio_myTotal', myTotal.toString()), [myTotal]);
  
  useEffect(() => localStorage.setItem('kingshot_ratio_mode', enemyInputMode), [enemyInputMode]);

  useEffect(() => localStorage.setItem('kingshot_ratio_enemyShield', enemyShield.toString()), [enemyShield]);
  useEffect(() => localStorage.setItem('kingshot_ratio_enemySpear', enemySpear.toString()), [enemySpear]);
  useEffect(() => localStorage.setItem('kingshot_ratio_enemyBow', enemyBow.toString()), [enemyBow]);

  useEffect(() => localStorage.setItem('kingshot_ratio_enemyTotal', enemyTotal.toString()), [enemyTotal]);
  useEffect(() => localStorage.setItem('kingshot_ratio_ratioShield', ratioShield.toString()), [ratioShield]);
  useEffect(() => localStorage.setItem('kingshot_ratio_ratioSpear', ratioSpear.toString()), [ratioSpear]);
  useEffect(() => localStorage.setItem('kingshot_ratio_ratioBow', ratioBow.toString()), [ratioBow]);

  // Derived Effective Enemy Stats
  const effectiveEnemy = useMemo(() => {
    if (enemyInputMode === 'count') {
        return { shield: enemyShield, spear: enemySpear, bow: enemyBow, total: enemyShield + enemySpear + enemyBow };
    } else {
        const totalRatio = ratioShield + ratioSpear + ratioBow;
        // Avoid division by zero
        if (totalRatio === 0 || enemyTotal === 0) {
            return { shield: 0, spear: 0, bow: 0, total: 0 };
        }
        
        // Calculate raw shares
        const s = Math.floor(enemyTotal * (ratioShield / totalRatio));
        const sp = Math.floor(enemyTotal * (ratioSpear / totalRatio));
        const b = Math.floor(enemyTotal * (ratioBow / totalRatio));
        
        // Note: Sum might be slightly less than enemyTotal due to floor, but negligible for strategy
        return { shield: s, spear: sp, bow: b, total: enemyTotal };
    }
  }, [enemyInputMode, enemyShield, enemySpear, enemyBow, enemyTotal, ratioShield, ratioSpear, ratioBow]);

  // Calculation Logic using Effective Stats
  const result = useMemo(() => {
    const { shield, spear, bow, total: enemyTotalCount } = effectiveEnemy;
    
    // Determine my capacity
    let capacity = myTotal;
    let isAutoCapacity = false;

    // If myTotal is 0, default to enemy total size to show ratio
    // If enemy total is also 0, use a default base for visualization
    if (capacity === 0) {
        capacity = enemyTotalCount > 0 ? enemyTotalCount : 100000; // Fallback default
        isAutoCapacity = true;
    }

    // Standard Logic
    // Bow = Enemy Shield / 2
    // Spear = Enemy Bow / 3
    let recBow = Math.ceil(shield / 2);
    let recSpear = Math.ceil(bow / 3);
    
    const requiredOffense = recBow + recSpear;
    let recShield = capacity - requiredOffense;
    
    let isOverflow = false;

    // Exception: Not enough capacity
    if (recShield < 0) {
        isOverflow = true;
        // Scale down to fit capacity
        const ratio = capacity > 0 ? capacity / requiredOffense : 0;
        
        // Recalculate to fit (Shield becomes 0)
        recShield = 0;
        recBow = Math.floor(recBow * ratio);
        recSpear = capacity - recBow; // Fill remainder with spear to match exact total
    }

    const total = Math.max(0, recShield) + Math.max(0, recSpear) + Math.max(0, recBow);

    // If total is 0 (should be covered by fallback, but just in case), prevent division by zero in UI
    const finalTotal = total > 0 ? total : 1; 

    return {
        shield: Math.max(0, recShield),
        spear: Math.max(0, recSpear),
        bow: Math.max(0, recBow),
        total: total,
        displayTotal: finalTotal, // for percentage calc
        isOverflow,
        isAutoCapacity,
        isEmpty: enemyTotalCount === 0 && myTotal === 0 // flag for empty input state
    };
  }, [myTotal, effectiveEnemy]);

  // Copy Function
  const handleCopy = () => {
    if (!result) return;
    const text = `【兵士編成メモ】
総兵数: ${result.total.toLocaleString()} ${result.isAutoCapacity ? '(敵同数想定)' : ''}
--------------
🛡️ 盾兵: ${((result.shield/result.displayTotal)*100).toFixed(0)}% (${result.shield.toLocaleString()})
⚔️ 槍兵: ${((result.spear/result.displayTotal)*100).toFixed(0)}% (${result.spear.toLocaleString()})
🏹 弓兵: ${((result.bow/result.displayTotal)*100).toFixed(0)}% (${result.bow.toLocaleString()})
--------------
Kingshot Optimizerで計算`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // OCR Analysis Logic
  const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    try {
        const worker = await createWorker('jpn');
        const ret = await worker.recognize(file);
        const rawText = ret.data.text;
        console.log("=== AIが読み取った全力のテキスト ===");
        console.log(rawText);
        console.log("===================================");
        await worker.terminate();

        // 1. Text Cleanup for Ratios (Keep decimals, remove commas)
        const textForRatios = rawText
            .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/,/g, '') 
            .replace(/\s+/g, ' ');

        // 2. & 3. 部隊総計の抽出（改行対応・強力結合版）
        let extractedTotal = 0;
        const totalMatch = rawText.match(/(?:部\s*隊\s*総|総\s*計|部\s*隊\s*合\s*計|Total|部\s*隊|兵\s*力)[\s\S]{0,30}?([0-9０-９][0-9０-９,，.．\s!！]*)/i);

        if (totalMatch) {
            let numStr = totalMatch[1];
            numStr = numStr.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
            const cleanNumStr = numStr.replace(/[^0-9]/g, '');

            if (cleanNumStr) {
                extractedTotal = parseInt(cleanNumStr);
            }
        }      
        
        // 4. Extract Percentages
        const percentMatches = textForRatios.match(/(\d+(?:\.\d+)?)\s*[%％]/g);
        
        const extractedRatios: number[] = [];
        if (percentMatches) {
            percentMatches.forEach(match => {
                const val = parseFloat(match.replace(/[%％]/, ''));
                if (!isNaN(val)) {
                    extractedRatios.push(val);
                }
            });
        }

        // Update State
        if (extractedTotal > 0 || extractedRatios.length > 0) {
            setEnemyInputMode('ratio');

            if (extractedTotal > 0) {
                setEnemyTotal(extractedTotal);
            }

            // Assume standard order: Shield -> Spear -> Bow
            if (extractedRatios.length >= 3) {
                setRatioShield(extractedRatios[0]);
                setRatioSpear(extractedRatios[1]);
                setRatioBow(extractedRatios[2]);
            } else if (extractedRatios.length > 0) {
                // Partial match, just fill what we found
                setRatioShield(extractedRatios[0] || 0);
                setRatioSpear(extractedRatios[1] || 0);
                setRatioBow(extractedRatios[2] || 0);
            }
        } else {
            alert("画像から数値を読み取れませんでした。");
        }

    } catch (err) {
        console.error(err);
        alert("画像の解析に失敗しました。");
    } finally {
        setIsAnalyzing(false);
        e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Input Section */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                戦況データの入力
            </h3>

            <div className="space-y-6">
                {/* My Stats */}
                <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-4">
                    <div className="mb-3 flex items-center gap-2 text-indigo-300 font-bold text-sm">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span> 自分 (Attacker)
                    </div>
                    <FormattedInput 
                        label="総出撃人数 (任意)" 
                        subLabel="未入力時は敵軍総数で計算されます"
                        value={myTotal} 
                        onChange={setMyTotal} 
                        icon={Users} 
                        color="text-indigo-400" 
                    />
                </div>

                {/* Enemy Stats */}
                <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-4 relative overflow-hidden transition-all duration-300">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span> 敵軍 (Defender)
                        </div>
                        
                        <div className="flex flex-col gap-2 w-full sm:w-auto sm:items-end">
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                                {/* OCR Button */}
                                <label className={`
                                    flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all border whitespace-nowrap
                                    ${isAnalyzing 
                                    ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
                                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                                    }
                                `}>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageAnalysis}
                                        disabled={isAnalyzing}
                                    />
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            解析中...
                                        </>
                                    ) : (
                                        <>
                                            <Camera className="w-3.5 h-3.5" />
                                            偵察画像から自動入力
                                        </>
                                    )}
                                </label>

                                {/* Input Mode Toggle */}
                                <div className="bg-slate-900/80 p-1 rounded-lg flex items-center gap-1 border border-white/5">
                                    <button 
                                        onClick={() => setEnemyInputMode('ratio')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${enemyInputMode === 'ratio' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                    >
                                        比率入力
                                    </button>
                                    <button 
                                        onClick={() => setEnemyInputMode('count')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${enemyInputMode === 'count' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                    >
                                        実数入力
                                    </button>
                                </div>
                            </div>

                            {/* Instruction Toggle */}
                            <div className="flex justify-end w-full sm:w-auto">
                                <button 
                                    onClick={() => setIsInstructionOpen(!isInstructionOpen)}
                                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                                >
                                    <Info className="w-3 h-3" />
                                    <span>撮影の注意点</span>
                                    {isInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Instruction Guide */}
                    {isInstructionOpen && (
                        <div className="mb-6 bg-slate-900/80 rounded-xl p-4 border border-indigo-500/30 text-left animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-indigo-400" />
                                読み取り精度の上げ方
                            </h4>
                            <ol className="text-xs text-slate-300 space-y-3 list-decimal list-outside ml-4 mb-4 leading-relaxed">
                                <li>ゲーム内のメールから偵察レポートを開く</li>
                                <li><span className="text-amber-400 font-bold">部隊総計の右にある「！」マーク</span>をタップする</li>
                                <li><span className="text-white font-bold">％（比率）が表示された状態</span>でスクショを撮る</li>
                            </ol>
                            <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20 p-6 flex flex-col items-center gap-4">
                                {/* SAMPLE IMAGE loaded from PUBLIC folder */}
                                <img 
                                    src="/sample.jpg" 
                                    alt="Scout Report Sample" 
                                    className="w-full max-w-[320px] h-auto rounded-lg border border-slate-700 shadow-lg"
                                />

                                <p className="text-[10px] text-slate-500 text-center max-w-[200px] break-keep">
                                    この画面（％が表示されている状態）をスクリーンショットして読み込ませてください
                                </p>
                            </div>
                        </div>
                    )}

                    {enemyInputMode === 'count' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-right-4 duration-300">
                            <FormattedInput 
                                label="敵の盾兵" 
                                subLabel="歩兵"
                                value={enemyShield} 
                                onChange={setEnemyShield} 
                                icon={Shield} 
                                color="text-blue-400" 
                            />
                            <FormattedInput 
                                label="敵の槍兵" 
                                subLabel="騎兵 (計算には不使用)"
                                value={enemySpear} 
                                onChange={setEnemySpear} 
                                icon={Swords} 
                                color="text-emerald-400" 
                            />
                            <FormattedInput 
                                label="敵の弓兵" 
                                subLabel="射手"
                                value={enemyBow} 
                                onChange={setEnemyBow} 
                                icon={Crosshair} 
                                color="text-rose-400" 
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <FormattedInput 
                                label="敵の総兵数 (概算)" 
                                subLabel="偵察レポートの総数"
                                value={enemyTotal} 
                                onChange={setEnemyTotal} 
                                icon={Users} 
                                color="text-slate-400"
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <FormattedInput 
                                    label="比率 (盾)" 
                                    compact
                                    value={ratioShield} 
                                    onChange={setRatioShield} 
                                    icon={Percent} 
                                    color="text-blue-400" 
                                    placeholder="0"
                                    allowDecimals={true}
                                />
                                <FormattedInput 
                                    label="比率 (騎)" 
                                    compact
                                    value={ratioSpear} 
                                    onChange={setRatioSpear} 
                                    icon={Percent} 
                                    color="text-emerald-400" 
                                    placeholder="0"
                                    allowDecimals={true}
                                />
                                <FormattedInput 
                                    label="比率 (弓)" 
                                    compact
                                    value={ratioBow} 
                                    onChange={setRatioBow} 
                                    icon={Percent} 
                                    color="text-rose-400" 
                                    placeholder="0"
                                    allowDecimals={true}
                                />
                            </div>
                            {/* Calculated Preview */}
                            {(effectiveEnemy.total > 0) && (
                                <div className="flex gap-2 text-[10px] text-slate-400 bg-slate-900/50 p-2 rounded-lg justify-center font-mono">
                                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400"/> {effectiveEnemy.shield.toLocaleString()}</span>
                                    <span className="text-slate-600">|</span>
                                    <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-emerald-400"/> {effectiveEnemy.spear.toLocaleString()}</span>
                                    <span className="text-slate-600">|</span>
                                    <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-rose-400"/> {effectiveEnemy.bow.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Result Section - ALWAYS VISIBLE */}
        {result && (
            <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-rose-500"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <PieChart className="w-6 h-6 text-amber-400" />
                            推奨兵士編成
                        </h3>
                        {result.isEmpty ? (
                            <p className="text-slate-500 text-xs font-bold mt-1 break-keep">
                                データ未入力のため、デフォルト（全盾）を表示しています
                            </p>
                        ) : (
                            <>
                                {result.isAutoCapacity && (
                                    <p className="text-indigo-300 text-xs font-bold mt-1 flex items-center gap-1 break-keep">
                                        <Info className="w-3 h-3" />
                                        自分の兵数が未入力のため、敵と同数（{result.total.toLocaleString()}）として比率を算出
                                    </p>
                                )}
                                {result.isOverflow && !result.isAutoCapacity && (
                                    <p className="text-rose-400 text-xs font-bold mt-1 flex items-center gap-1 break-keep">
                                        <AlertTriangle className="w-3 h-3" />
                                        出撃上限不足のため、火力を維持しつつ盾兵を0にして調整しました
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? 'コピー完了' : '結果をコピー'}
                    </button>
                </div>

                {/* Visual Bar */}
                <div className="mb-8">
                    <div className="flex h-6 w-full rounded-full overflow-hidden bg-slate-800 ring-4 ring-slate-800/50">
                        <div style={{ width: `${(result.shield / result.displayTotal) * 100}%` }} className="h-full bg-blue-500 transition-all duration-500 relative group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div style={{ width: `${(result.spear / result.displayTotal) * 100}%` }} className="h-full bg-emerald-500 transition-all duration-500 relative group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div style={{ width: `${(result.bow / result.displayTotal) * 100}%` }} className="h-full bg-rose-500 transition-all duration-500 relative group">
                             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1 font-mono">
                        <span>0</span>
                        <span>{result.total.toLocaleString()}</span>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Shield */}
                    <div className={`p-4 rounded-xl border ${result.isOverflow ? 'bg-slate-800/30 border-slate-700 opacity-50' : 'bg-blue-900/20 border-blue-500/30'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-blue-400 font-bold text-sm flex items-center gap-1.5"><Shield className="w-4 h-4" /> 盾兵</div>
                        </div>
                        <div className="flex flex-col-reverse">
                             <div className="text-sm font-medium text-slate-400 tabular-nums">{result.shield.toLocaleString()}人</div>
                             <div className="text-3xl font-black text-white tabular-nums flex items-baseline">
                                {((result.shield/result.displayTotal)*100).toFixed(1)}<span className="text-lg text-slate-500 ml-0.5">%</span>
                             </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                             {result.isOverflow ? 'コストカット対象' : '残り枠すべて'}
                        </div>
                    </div>

                    {/* Spear */}
                    <div className="p-4 rounded-xl border bg-emerald-900/20 border-emerald-500/30">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5"><Swords className="w-4 h-4" /> 槍兵</div>
                        </div>
                        <div className="flex flex-col-reverse">
                             <div className="text-sm font-medium text-slate-400 tabular-nums">{result.spear.toLocaleString()}人</div>
                             <div className="text-3xl font-black text-white tabular-nums flex items-baseline">
                                {((result.spear/result.displayTotal)*100).toFixed(1)}<span className="text-lg text-slate-500 ml-0.5">%</span>
                             </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 pt-2 border-white/5 border-t">
                            対 弓兵 (敵弓 ÷ 3)
                        </div>
                    </div>

                    {/* Bow */}
                    <div className="p-4 rounded-xl border bg-rose-900/20 border-rose-500/30">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-rose-400 font-bold text-sm flex items-center gap-1.5"><Crosshair className="w-4 h-4" /> 弓兵</div>
                        </div>
                        <div className="flex flex-col-reverse">
                             <div className="text-sm font-medium text-slate-400 tabular-nums">{result.bow.toLocaleString()}人</div>
                             <div className="text-3xl font-black text-white tabular-nums flex items-baseline">
                                {((result.bow/result.displayTotal)*100).toFixed(1)}<span className="text-lg text-slate-500 ml-0.5">%</span>
                             </div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-2 pt-2 border-white/5 border-t">
                            対 盾兵 (敵盾 ÷ 2)
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Logic Explanation Card */}
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 md:p-8 space-y-6">
            <h4 className="text-center font-bold text-slate-200 text-lg border-b border-white/5 pb-4">
                兵士比率の最適解まとめ
            </h4>

            <div className="space-y-4">
                <div>
                    <h5 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> 推奨計算式（黄金比）
                    </h5>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3 break-keep">
                        敵の編成を見て、火力を必要最小限にし、残りを耐久に回す計算式です。<br/>
                        <span className="text-xs text-slate-500">※自分の兵数が未入力の場合は、敵軍と同数の兵力があると仮定して比率を算出します。</span>
                    </p>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-sm">
                        <div className="flex items-center gap-2 text-rose-400">
                            <Crosshair className="w-4 h-4" /> 弓兵 ＝ 敵「盾」の 1/2
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400">
                            <Swords className="w-4 h-4" /> 槍兵 ＝ 敵「弓」の 1/3
                        </div>
                        <div className="flex items-center gap-2 text-blue-400">
                            <Shield className="w-4 h-4" /> 盾兵 ＝ 残り枠すべて
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <h5 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" /> 兵種の役割（3すくみ）
                    </h5>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="shrink-0 p-2 bg-blue-900/20 rounded-lg h-fit text-blue-400"><Shield className="w-4 h-4" /></div>
                            <div>
                                <div className="font-bold text-slate-200 text-sm">盾兵（歩兵）：壁役</div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed break-keep">全ての攻撃を受け止める最重要ポジション。これが全滅すると、後衛（槍・弓）も即死する。</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="shrink-0 p-2 bg-emerald-900/20 rounded-lg h-fit text-emerald-400"><Swords className="w-4 h-4" /></div>
                            <div>
                                <div className="font-bold text-slate-200 text-sm">槍兵（騎兵）：対 弓</div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed break-keep">敵の後衛（火力）を削るのが仕事。敵弓の「1/3の人数」で殲滅可能。</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="shrink-0 p-2 bg-rose-900/20 rounded-lg h-fit text-rose-400"><Crosshair className="w-4 h-4" /></div>
                            <div>
                                <div className="font-bold text-slate-200 text-sm">弓兵（弓兵）：対 盾</div>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed break-keep">敵の前衛（壁）を削るのが仕事。敵盾の「1/2の人数」で殲滅可能。</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                    <h5 className="text-sm font-bold text-slate-200 mb-3">この編成にする根拠</h5>
                    <ul className="space-y-3 text-sm text-slate-400">
                        <li className="flex gap-2">
                            <span className="text-amber-500 font-bold shrink-0">①</span>
                            <span className="break-keep">
                                <strong className="text-slate-300">盾の生存 ＝ 勝利</strong><br/>
                                火力職（槍・弓）には防御力がありません。盾が生き残っている時間だけが、攻撃できる時間です。
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-amber-500 font-bold shrink-0">②</span>
                            <span className="break-keep">
                                <strong className="text-slate-300">火力枠は少数精鋭でよい</strong><br/>
                                相性補正により、弓は2倍、槍は3倍の効率で敵を倒せます。過剰に編成する必要はありません。
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="text-amber-500 font-bold shrink-0">③</span>
                            <span className="break-keep">
                                <strong className="text-slate-300">余剰枠はすべて耐久へ</strong><br/>
                                火力を計算式通りの最小限に抑え、浮いた枠をすべて「盾」に回すことで生存時間を最大化します。
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TroopRatioCalculator;
