
import React, { useState, useEffect, useMemo } from 'react';
import { createWorker } from 'tesseract.js';
import { RESOURCE_CONFIGS, SOLDIER_RESOURCE_RATIOS } from '../constants';
import { ResourceType } from '../types';
import { Calculator, AlertTriangle, TrendingDown, Scale, ArrowDown, Medal, ArrowRight, Info, ChevronDown, ChevronUp, Swords, Activity, Stethoscope, Camera, Loader2 } from 'lucide-react';

const ResourceManager: React.FC = () => {
    // データ保存用のState
    const [holdings, setHoldings] = useState<Record<ResourceType, string>>(() => {
        try {
            const saved = localStorage.getItem('kingshot_resources');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return { food: '', wood: '', stone: '', iron: '' };
    });

    const [healingTargetLevel, setHealingTargetLevel] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('kingshot_resource_healing_level');
            return saved ? parseInt(saved) : 10;
        } catch { return 10; }
    });

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // ローカルストレージへの保存
    useEffect(() => {
        localStorage.setItem('kingshot_resources', JSON.stringify(holdings));
    }, [holdings]);

    useEffect(() => {
        localStorage.setItem('kingshot_resource_healing_level', healingTargetLevel.toString());
    }, [healingTargetLevel]);

    const [isComposing, setIsComposing] = useState(false);
    const [isInstructionOpen, setIsInstructionOpen] = useState(false);

    // 全角数字などを半角に変換
    const toHalfWidth = (str: string): string => {
        return str
            .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/．/g, '.')
            .replace(/，/g, ',');
    };

    // k/m/g の単位計算
    const parseSmartNumber = (val: string): number => {
        if (!val) return 0;
        const normalized = toHalfWidth(val);
        const lower = normalized.toLowerCase().replace(/,/g, '').trim();
        const num = parseFloat(lower);
        if (isNaN(num)) return 0;

        if (lower.endsWith('k')) return num * 1000;
        if (lower.endsWith('m')) return num * 1000000;
        if (lower.endsWith('g')) return num * 1000000000;
        return num;
    };

    const handleHoldingChange = (id: ResourceType, val: string) => {
        if (isComposing) {
            setHoldings(prev => ({ ...prev, [id]: val }));
            return;
        }
        const normalized = toHalfWidth(val);
        setHoldings(prev => ({ ...prev, [id]: normalized }));
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, id: ResourceType) => {
        setIsComposing(false);
        const normalized = toHalfWidth(e.currentTarget.value);
        setHoldings(prev => ({ ...prev, [id]: normalized }));
    };

    const applyMultiplier = (id: ResourceType, mult: string) => {
        const current = holdings[id];
        if (!current) {
            setHoldings(prev => ({ ...prev, [id]: mult }));
            return;
        }
        const base = toHalfWidth(current).replace(/[kmg]$/i, '');
        setHoldings(prev => ({ ...prev, [id]: base + mult }));
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    // ---------------------------------------------------------
    // 【修正版】OCR解析ロジック（空行スキップ機能付き）
    // ---------------------------------------------------------
    const parseOCRText = (text: string) => {
        const lines = text.split('\n');
        const results: Record<string, string> = {};

        const keywords: Record<ResourceType, string[]> = {
            food: ['パン','ハン','バン','パソ','ハソ','バソ', 'Bread', 'Food'],
            wood: ['木材', 'Wood'],
            stone: ['石材', 'Stone'],
            iron: ['鉄鉱', 'Iron']
        };

        const cleanValue = (str: string) => {
            // スペースを除去してから数字以外を削除
            return str.replace(/\s/g, '').replace(/[^0-9\.,kKmMgG]/g, '');
        };

        // 数字抽出用正規表現（数字 + 任意のスペース + 単位）
        const numRegex = /([0-9\.,]+\s?[kKmMgG]?)/g;

        // 木材が見つかった行番号
        let woodLineIndex = -1;

        // 1. 基本検索：キーワードのある行を探す
        Object.entries(keywords).forEach(([type, keys]) => {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                if (!keys.some(k => line.includes(k))) continue;

                // その行に数字があるか
                let valMatch = line.match(numRegex);

                // その行になければ次の行も見る（スマホ改行対策）
                if ((!valMatch || valMatch.length === 0) && i + 1 < lines.length) {
                    const nextLine = lines[i + 1];
                    const nextHasOtherKey = Object.values(keywords).flat().some(k => nextLine.includes(k) && !keys.includes(k));
                    if (!nextHasOtherKey) {
                        valMatch = nextLine.match(numRegex);
                    }
                }

                if (valMatch && valMatch.length > 0) {
                    results[type] = cleanValue(valMatch[valMatch.length - 1]);
                    
                    if (type === 'wood') {
                        woodLineIndex = i;
                    }
                    break;
                }
            }
        });

        // 2. 【最強のパン救済ロジック】
        // パンが取れておらず、木材が見つかっている場合
        if (!results['food'] && woodLineIndex > 0) {
            // 木材の行から、最大5行さかのぼって数字を探す
            // これにより、間に空行やゴミ行があってもスキップしてパンの数字に到達できる
            for (let j = 1; j <= 5; j++) {
                const targetIndex = woodLineIndex - j;
                if (targetIndex < 0) break; // 最初の行を超えたら終了

                const targetLine = lines[targetIndex];
                const valMatch = targetLine.match(numRegex);

                if (valMatch && valMatch.length > 0) {
                    // 数字が見つかったら即採用（これがパンのはず）
                    results['food'] = cleanValue(valMatch[valMatch.length - 1]);
                    console.log(`Food found by backtracking ${j} lines from Wood`);
                    break;
                }
            }
        }

        return results;
    };

    const handleImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsAnalyzing(true);
        
        try {
            const worker = await createWorker('jpn');
            const ret = await worker.recognize(file);
            const text = ret.data.text;
            
            const extracted = parseOCRText(text);
            
            setHoldings(prev => ({
                ...prev,
                food: extracted.food || prev.food,
                wood: extracted.wood || prev.wood,
                stone: extracted.stone || prev.stone,
                iron: extracted.iron || prev.iron,
            }));
            
            await worker.terminate();
        } catch (err) {
            console.error("OCR Error:", err);
            alert("文字の読み取りに失敗しました。画像が鮮明か確認してください。");
        } finally {
            setIsAnalyzing(false);
            e.target.value = '';
        }
    };
    // ---------------------------------------------------------

    const standardAnalysisData = useMemo(() => {
        const data = RESOURCE_CONFIGS.map(config => {
            const val = parseSmartNumber(holdings[config.id]);
            const ratio = config.ratio;
            let score = 0;
            if (ratio > 0) {
                score = val / ratio;
            } else {
                score = Number.POSITIVE_INFINITY;
            }
            return {
                ...config, val, ratio, score, hasInput: val > 0, isNotNeeded: ratio === 0
            };
        });
        return [...data].sort((a, b) => {
            if (a.score === b.score) return 0;
            return a.score - b.score;
        });
    }, [holdings]);

    const healingAnalysisData = useMemo(() => {
        const ratioData = SOLDIER_RESOURCE_RATIOS.find(r => r.level === healingTargetLevel);
        const ratios = ratioData ? ratioData.ratios : { food: 20, wood: 20, stone: 4, iron: 1 };
        const data = RESOURCE_CONFIGS.map(config => {
            const val = parseSmartNumber(holdings[config.id]);
            const ratio = ratios[config.id as ResourceType] || 0;
            let score = 0;
            if (ratio > 0) {
                score = val / ratio;
            } else {
                score = Number.POSITIVE_INFINITY;
            }
            return {
                ...config, val, ratio, score, isNotNeeded: ratio === 0
            };
        });
        return [...data].sort((a, b) => a.score - b.score);
    }, [holdings, healingTargetLevel]);

    const healingLevelInfo = useMemo(() => 
        SOLDIER_RESOURCE_RATIOS.find(r => r.level === healingTargetLevel), 
    [healingTargetLevel]);

    const hasAnyInput = standardAnalysisData.some(d => d.val > 0);
    const finiteScores = standardAnalysisData.filter(d => isFinite(d.score)).map(d => d.score);
    const maxScore = finiteScores.length > 0 ? Math.max(...finiteScores) : 1;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-3 px-2">
                    <Scale className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-200 break-keep">標準バランス (20 : 20 : 4 : 1)</h3>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                    {RESOURCE_CONFIGS.map(config => (
                        <div key={config.id} className="flex flex-col items-center justify-center p-1">
                            <span className={`text-[10px] font-bold uppercase ${config.color} mb-1 opacity-70`}>{config.name}</span>
                            <span className="text-lg sm:text-xl font-mono font-bold text-slate-200">
                                {config.ratio}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
                        <div className="mb-6 bg-slate-800/50 -mx-6 -mt-6 p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                <Calculator className="w-4 h-4" />
                                総資源入力
                            </h3>
                            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${isAnalyzing ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'}`}>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageAnalysis} disabled={isAnalyzing} />
                                {isAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />解析中 (OCR)</> : <><Camera className="w-3.5 h-3.5" />画像から自動入力</>}
                            </label>
                        </div>
                        <div className="mb-6">
                            <button onClick={() => setIsInstructionOpen(!isInstructionOpen)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                                <Info className="w-3 h-3" /><span>総資源の確認方法</span>{isInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isInstructionOpen && (
                                <div className="mt-4 bg-slate-900/50 rounded-xl p-4 border border-white/5 animate-in slide-in-from-top-2">
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs font-medium text-slate-400">
                                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">バッグ</span>
                                        <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                                        <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">右上のグラフアイコン</span>
                                        <ArrowRight className="w-3 h-3 rotate-90 sm:rotate-0" />
                                        <span className="text-amber-400">スクショまたは入力</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 break-keep">※OCR解析のため、画像内の文字がはっきり見えるようにしてください。</p>
                                </div>
                            )}
                        </div>
                        <div className="space-y-6">
                            {RESOURCE_CONFIGS.map((config) => (
                                <div key={config.id} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className={`text-sm font-bold flex items-center gap-2 ${config.color}`}>{config.name}</label>
                                        {holdings[config.id] && <span className="text-xs text-slate-500 font-mono">{parseSmartNumber(holdings[config.id]).toLocaleString()}</span>}
                                    </div>
                                    <div className="flex gap-1.5">
                                        <input type="text" inputMode="decimal" value={holdings[config.id]} onChange={(e) => handleHoldingChange(config.id, e.target.value)} onCompositionStart={() => setIsComposing(true)} onCompositionEnd={(e) => handleCompositionEnd(e, config.id)} onFocus={handleFocus} placeholder="0" className={`min-w-0 flex-1 bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-3 py-3 text-lg font-mono text-white focus:ring-2 focus:${config.ringColor} outline-none shadow-inner transition-colors placeholder:text-slate-600`} />
                                        <div className="flex gap-0.5 shrink-0">
                                            {['k', 'm', 'g'].map((unit) => (
                                                <button key={unit} onClick={() => applyMultiplier(config.id, unit)} className={`w-9 rounded-lg font-bold text-sm transition-all border border-slate-700 hover:border-slate-500 active:scale-95 flex items-center justify-center uppercase ${holdings[config.id].toLowerCase().endsWith(unit) ? `${config.bgColor} text-white shadow-lg` : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700'}`}>{unit}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {hasAnyInput ? (
                        <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl h-full flex flex-col">
                            <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 break-keep">
                                <TrendingDown className="w-4 h-4" />採取優先度 (標準比率 20:20:4:1)
                            </h3>
                            <div className="space-y-4 flex-1">
                                {standardAnalysisData.map((data, index) => {
                                    let percentage = 100;
                                    if (data.ratio > 0 && maxScore > 0) percentage = (data.score / maxScore) * 100;
                                    const isTopPriority = index === 0 && data.ratio > 0 && isFinite(data.score);
                                    return (
                                        <div key={data.id} className={`relative p-4 rounded-xl border transition-all duration-500 ${isTopPriority ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-rose-500/50 shadow-lg shadow-rose-900/10' : 'bg-slate-800/30 border-slate-700/50'}`}>
                                            {isTopPriority && (
                                                <div className="absolute -top-3 -right-3">
                                                    <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                                        <AlertTriangle className="w-3 h-3 fill-white" />最優先
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-end mb-2 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg ${isTopPriority ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{index + 1}</div>
                                                    <div>
                                                        <div className={`font-bold text-lg leading-none ${data.color}`}>{data.name}</div>
                                                        <div className="text-[10px] text-slate-500 mt-1">比率: {data.ratio}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isTopPriority ? <div className="text-rose-400 text-xs font-bold flex items-center justify-end gap-1"><ArrowDown className="w-3 h-3" /> 不足</div> : <div className="text-emerald-400 text-xs font-bold">充足気味</div>}
                                                </div>
                                            </div>
                                            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden relative">
                                                <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isTopPriority ? 'bg-rose-500' : data.bgColor}`} style={{ width: `${Math.max(percentage, 2)}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                {standardAnalysisData[0] && standardAnalysisData[0].ratio > 0 ? (
                                    <p className="text-sm text-slate-400 break-keep">標準バランスでは <span className="font-bold text-rose-400">{standardAnalysisData[0].name}</span> が不足しています。</p>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#0F172A]/50 rounded-xl border border-white/5 h-full flex flex-col items-center justify-center p-10 text-slate-600">
                            <Medal className="w-16 h-16 mb-4 opacity-20" />
                            <p>数値を入力すると<br />ランキングが表示されます</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-8 border-t border-white/5">
                <div className="bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden ring-1 ring-indigo-500/30">
                    <div className="w-full flex items-center justify-between p-4 bg-slate-800/30 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500 text-white"><Stethoscope className="w-5 h-5" /></div>
                            <div className="text-left">
                                <h3 className="text-sm font-bold text-white break-keep">兵士治療シミュレーター</h3>
                                <p className="text-[10px] text-slate-500 break-keep">兵士レベルごとの治療コスト比率を確認</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                            <label className="text-sm font-bold text-indigo-300">対象の兵士レベル</label>
                            <div className="relative w-full sm:w-auto">
                                <select value={healingTargetLevel} onChange={(e) => setHealingTargetLevel(parseInt(e.target.value))} className="w-full sm:w-64 appearance-none bg-slate-900 border border-slate-700 hover:border-slate-500 text-white pl-4 pr-10 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer">
                                    {SOLDIER_RESOURCE_RATIOS.map((s) => (
                                        <option key={s.level} value={s.level}>Lv.{s.level} {s.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/50 rounded-xl p-4 border border-white/5 mb-6">
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                                {healingLevelInfo && Object.entries(healingLevelInfo.ratios).map(([key, ratio]) => {
                                    const config = RESOURCE_CONFIGS.find(c => c.id === key);
                                    if (!config) return null;
                                    return (
                                        <div key={key} className="flex flex-col items-center">
                                            <span className={`text-[10px] font-bold uppercase ${config.color} mb-1 opacity-70`}>{config.name}</span>
                                            <span className="text-lg font-mono font-bold text-slate-300">{(ratio as number).toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {hasAnyInput ? (
                            <div className="space-y-3">
                                {healingAnalysisData.map((data, index) => {
                                    let percentage = 100;
                                    const healingFiniteScores = healingAnalysisData.filter(d => isFinite(d.score)).map(d => d.score);
                                    const healingMaxScore = healingFiniteScores.length > 0 ? Math.max(...healingFiniteScores) : 1;
                                    if (data.ratio > 0 && healingMaxScore > 0) percentage = (data.score / healingMaxScore) * 100;
                                    const isBottleneck = index === 0 && data.ratio > 0 && isFinite(data.score);
                                    return (
                                        <div key={data.id} className={`relative p-3 rounded-xl border transition-all ${isBottleneck ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-rose-500/50' : 'bg-slate-800/30 border-slate-700/50'}`}>
                                            {isBottleneck && (
                                                <div className="absolute -top-2 -right-2">
                                                    <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">優先</div>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center mb-1 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <div className={`text-sm font-bold ${data.color}`}>{data.name}</div>
                                                    {data.ratio > 0 && <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 rounded">比率 {data.ratio.toFixed(2)}</span>}
                                                </div>
                                                <div className="text-xs font-mono text-slate-400">{isFinite(data.score) ? `可: ${Math.floor(data.score).toLocaleString()}人分` : '∞'}</div>
                                            </div>
                                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${isBottleneck ? 'bg-rose-500' : data.bgColor}`} style={{ width: `${Math.max(percentage, 5)}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-600">
                                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">資源を入力すると<br />治療可能数が計算されます</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceManager;
