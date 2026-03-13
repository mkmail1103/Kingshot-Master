import React, { useState, useMemo, useEffect } from 'react';
import { Shield, Swords, Clock, AlertTriangle, User, Plus, Trash2, Copy, Check } from 'lucide-react';

interface Rally {
  id: number;
  playerName: string;
  remainingTime: number;
  marchTime: number;
}

const TimeInput: React.FC<{
  label: string;
  totalSeconds: number;
  onChange: (val: number) => void;
}> = ({ label, totalSeconds, onChange }) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  const handleMChange = (newM: number) => onChange(Math.max(0, newM) * 60 + s);
  const handleSChange = (newS: number) => {
    if (newS >= 60) {
       onChange((m + Math.floor(newS/60)) * 60 + (newS % 60));
    } else if (newS < 0) {
       const total = m * 60 + newS;
       onChange(Math.max(0, total));
    } else {
       onChange(m * 60 + newS);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden focus-within:border-cyan-500/50 transition-colors">
        <button 
          onClick={() => onChange(Math.max(0, totalSeconds - 10))} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono transition-colors active:bg-[#333]"
        >-10s</button>
        <div className="flex-1 flex items-center justify-center">
          <input 
            type="number" 
            value={m === 0 ? '' : m} 
            onChange={e => handleMChange(parseInt(e.target.value) || 0)} 
            className="w-10 text-right bg-transparent text-white font-mono text-lg outline-none py-1" 
            placeholder="0"
          />
          <span className="text-slate-500 font-mono mx-1">分</span>
          <input 
            type="number" 
            value={s} 
            onChange={e => handleSChange(parseInt(e.target.value) || 0)} 
            className="w-10 text-right bg-transparent text-white font-mono text-lg outline-none py-1" 
            placeholder="0"
          />
          <span className="text-slate-500 font-mono ml-1">秒</span>
        </div>
        <button 
          onClick={() => onChange(totalSeconds + 10)} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono border-l border-[#222] transition-colors active:bg-[#333]"
        >+10s</button>
      </div>
    </div>
  );
};

const NumberInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
}> = ({ label, value, onChange, min = 0 }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden focus-within:border-cyan-500/50 transition-colors">
        <button 
          onClick={() => onChange(Math.max(min, value - 10))} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono transition-colors active:bg-[#333]"
        >-10</button>
        <button 
          onClick={() => onChange(Math.max(min, value - 1))} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono border-r border-[#222] transition-colors active:bg-[#333]"
        >-1</button>
        <input 
          type="number" 
          value={value === 0 ? '' : value} 
          onChange={e => onChange(Math.max(min, parseInt(e.target.value) || 0))} 
          className="w-full min-w-[3rem] text-center bg-transparent text-white font-mono text-lg outline-none py-1" 
          placeholder="0"
        />
        <button 
          onClick={() => onChange(value + 1)} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono border-l border-[#222] transition-colors active:bg-[#333]"
        >+1</button>
        <button 
          onClick={() => onChange(value + 10)} 
          className="px-2.5 py-2 bg-[#111] hover:bg-[#222] text-slate-300 text-xs font-mono transition-colors active:bg-[#333]"
        >+10</button>
      </div>
    </div>
  );
};

const CastleBattle: React.FC = () => {
  const [myMarchTime, setMyMarchTime] = useState<number>(() => {
    const saved = localStorage.getItem('castleBattle_myMarchTime');
    return saved !== null ? parseInt(saved, 10) : 40;
  });
  
  const [rallies, setRallies] = useState<Rally[]>(() => {
    const saved = localStorage.getItem('castleBattle_rallies');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: 1, playerName: '', remainingTime: 300, marchTime: 30 },
      { id: 2, playerName: '', remainingTime: 330, marchTime: 30 },
    ];
  });
  
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('castleBattle_myMarchTime', myMarchTime.toString());
  }, [myMarchTime]);

  useEffect(() => {
    localStorage.setItem('castleBattle_rallies', JSON.stringify(rallies));
  }, [rallies]);

  const addRally = () => {
    if (rallies.length >= 5) return;
    const newId = Math.max(0, ...rallies.map(r => r.id)) + 1;
    setRallies([...rallies, { id: newId, playerName: '', remainingTime: 300, marchTime: 30 }]);
  };

  const removeRally = (id: number) => {
    if (rallies.length <= 1) return;
    setRallies(rallies.filter(r => r.id !== id));
  };

  const updateRally = (id: number, field: keyof Rally, value: any) => {
    setRallies(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const sortedRallies = useMemo(() => {
    return [...rallies]
      .map(r => ({ ...r, impactTime: r.remainingTime + r.marchTime }))
      .sort((a, b) => a.impactTime - b.impactTime);
  }, [rallies]);

  const handleCopy = () => {
    let text = "【王城戦 敵集結情報】\n\n";

    sortedRallies.forEach((rally, index) => {
      const playerName = rally.playerName ? ` (${rally.playerName})` : '';
      
      text += `${index + 1}撃目${playerName}: 敵行軍 ${rally.marchTime}秒\n`;
      
      const nextRally = sortedRallies[index + 1];
      if (nextRally) {
        const gap = nextRally.impactTime - rally.impactTime;
        text += `   ↓ 隙間: ${gap}秒\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* My Stats */}
      <div className="bg-[#0a0a0a] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">自分の駐屯設定</h3>
        </div>
        <div className="max-w-xs">
          <NumberInput 
            label="自分の行軍時間 (秒)" 
            value={myMarchTime} 
            onChange={setMyMarchTime} 
          />
        </div>
      </div>

      {/* Enemy Rallies Input */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">敵集結の設定</h3>
          {rallies.length < 5 && (
            <button 
              onClick={addRally}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-sm font-medium transition-colors border border-rose-500/30"
            >
              <Plus className="w-4 h-4" />
              集結を追加 ({rallies.length}/5)
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rallies.map((rally, index) => (
            <div key={rally.id} className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-4 relative overflow-hidden group focus-within:border-rose-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full -z-10 group-focus-within:bg-rose-500/10 transition-colors"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs border border-rose-500/30">
                    {index + 1}
                  </div>
                  <h4 className="font-bold text-slate-200">敵集結 {index + 1}</h4>
                </div>
                {rallies.length > 1 && (
                  <button 
                    onClick={() => removeRally(rally.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">プレイヤー名 (任意)</label>
                  <div className="flex items-center bg-[#0a0a0a] rounded-lg border border-[#222] overflow-hidden focus-within:border-cyan-500/50 transition-colors px-3 py-2">
                    <User className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                    <input 
                      type="text" 
                      value={rally.playerName} 
                      onChange={e => updateRally(rally.id, 'playerName', e.target.value)} 
                      className="w-full bg-transparent text-white text-sm outline-none placeholder:text-slate-600" 
                      placeholder="例: 敵のエース"
                    />
                  </div>
                </div>
                <TimeInput 
                  label="集結残り時間" 
                  totalSeconds={rally.remainingTime} 
                  onChange={(v) => updateRally(rally.id, 'remainingTime', v)} 
                />
                <NumberInput 
                  label="敵の行軍時間 (秒)" 
                  value={rally.marchTime} 
                  onChange={(v) => updateRally(rally.id, 'marchTime', v)} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      <div className="bg-[#050505] border border-[#1a1a1a] rounded-2xl p-1 overflow-hidden">
        <div className="bg-gradient-to-r from-[#0a0a0a] to-[#111] rounded-xl p-5">
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-fuchsia-500/20 rounded-lg shrink-0">
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
              </div>
              <h3 className="text-[14px] sm:text-xl font-black text-white tracking-tight leading-tight">着弾分析 & 駐屯タイミング</h3>
            </div>
            
            <button 
              onClick={handleCopy}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all shrink-0 ${
                isCopied 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {isCopied ? 'コピーしました' : '結果をコピー'}
            </button>
          </div>

          <div className="space-y-4">
            {sortedRallies.map((rally, index) => {
              const nextRally = sortedRallies[index + 1];
              const gap = nextRally ? nextRally.impactTime - rally.impactTime : null;
              
              // Timing logic
              const isDuringRally = myMarchTime >= rally.marchTime;
              const timingValue = isDuringRally 
                ? myMarchTime - rally.marchTime 
                : rally.marchTime - myMarchTime;
              
              const timeToImpact = rally.impactTime;

              return (
                <div key={rally.id} className="relative">
                  <div className="bg-[#000] border border-[#222] rounded-xl p-4 shadow-lg flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    
                    {/* Left: Enemy Impact Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#111] border border-[#333] flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-lg font-black text-rose-500">{index + 1}</span>
                        <span className="text-[10px] text-slate-500 ml-0.5 mt-1">撃目</span>
                      </div>
                      <div>
                        {rally.playerName && (
                          <div className="text-xs font-bold text-rose-400 mb-0.5 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {rally.playerName}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          着弾まで
                        </div>
                        <div className="text-2xl font-mono font-bold text-white leading-none">
                          {timeToImpact} <span className="text-sm text-slate-500 font-sans">秒</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: My Action */}
                    <div className="bg-cyan-950/20 border border-cyan-900/40 rounded-lg p-3 flex-1 w-full sm:w-auto">
                      <div className="text-xs text-cyan-400/80 mb-1 font-medium">同時着弾タイミング(ここから1秒ずらす)</div>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {isDuringRally ? (
                          <>
                            <span className="text-slate-300 text-sm">敵の集結残り</span>
                            <span className="text-2xl font-black text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">{timingValue}</span>
                            <span className="text-slate-300 text-sm">秒で出発</span>
                          </>
                        ) : (
                          <>
                            <span className="text-slate-300 text-sm">敵が走り出してから</span>
                            <span className="text-2xl font-black text-fuchsia-400 font-mono drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]">{timingValue}</span>
                            <span className="text-slate-300 text-sm">秒後に出発</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gap indicator */}
                  {gap !== null && (
                    <div className="flex flex-col items-center justify-center py-2 relative">
                      <div className="absolute top-0 bottom-0 w-px bg-[#333]"></div>
                      <div className="relative z-10 bg-[#111] border border-[#333] rounded-full px-3 py-1 flex items-center gap-2 shadow-md">
                        <span className="text-xs text-slate-400">着弾の隙間</span>
                        <span className={`text-sm font-bold font-mono ${gap <= 2 ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]' : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]'}`}>
                          {gap} 秒
                        </span>
                        {gap <= 2 && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CastleBattle;
