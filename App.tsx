
import React, { useState } from 'react';
import Calculator from './components/Calculator';
import ResourceManager from './components/ResourceManager';
import MobilizationGuide from './components/MobilizationGuide';
import TroopRatioCalculator from './components/TroopRatioCalculator';
import { Crown, Zap, Pickaxe, Gift, Copy, Check, ExternalLink, User, Info, Flag, History, CalendarClock, PieChart } from 'lucide-react';

type ViewMode = 'speedup' | 'resource' | 'giftcode' | 'mobilization' | 'ratio';

const App: React.FC = () => {
  // Default view set to 'mobilization' as requested
  // To switch back to Strongest Lord, change 'mobilization' to 'speedup'
  const [view, setView] = useState<ViewMode>('ratio');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedPastCode, setCopiedPastCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyPastCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPastCode(code);
    setTimeout(() => setCopiedPastCode(null), 2000);
  };

  const LATEST_CODE = {
    code: "ENERGY0112",
    limit: "2026年1月15日"
  };

  const OTHER_CODES = [
    { code: "jpseijin26", limit: "2026/01/15まで" },
    { code: "THURMADNESS", limit: "2026/01/11まで" },
    { code: "SEEYOUIN2026", limit: "2026/01/04まで" },
    { code: "JPX27KFOLLOW", limit: "2026/01/04まで" },
    { code: "KINGSHOTXMAS", limit: "2025/12/31まで" },
    { code: "THEKINGSTORE", limit: "2026/01/05まで" },
    { code: "KINGSHOT13M", limit: "2025/12/24まで" },
    { code: "STORELAUNCH", limit: "期限不明" }
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-hidden selection:bg-amber-500/30">
      
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1120]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer" onClick={() => setView('speedup')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <Crown className="text-white w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight leading-none group-hover:text-white transition-colors">Kingshot <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Optimizer</span></h1>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-0.5 sm:mt-1">Unofficial Strategy Tool</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">v0.25.0</div>
          </div>
        </div>
      </header>

      {/* Navigation Bar - Modernized */}
      <div className="sticky top-16 z-40 bg-[#0B1120]/60 backdrop-blur-md border-b border-white/5 py-4 overflow-x-auto no-scrollbar">
        <div className="max-w-3xl mx-auto px-4 min-w-[360px]">
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-white/5 flex gap-1 shadow-2xl relative">
             {[
               { id: 'ratio', icon: PieChart, label: '兵士比率', color: 'bg-rose-600', text: 'text-rose-400' },
               { id: 'mobilization', icon: Flag, label: '総動員', color: 'bg-indigo-600', text: 'text-indigo-400' },
               { id: 'speedup', icon: Zap, label: '最強領主', color: 'bg-amber-600', text: 'text-amber-400' },
               { id: 'resource', icon: Pickaxe, label: '資源', color: 'bg-blue-600', text: 'text-blue-400' },
               { id: 'giftcode', icon: Gift, label: 'ギフコ', color: 'bg-emerald-600', text: 'text-emerald-400' },
             ].map((tab) => {
               const isActive = view === tab.id;
               const Icon = tab.icon;
               return (
                 <button
                    key={tab.id}
                    onClick={() => setView(tab.id as ViewMode)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all duration-300 relative whitespace-nowrap ${
                      isActive 
                        ? 'bg-slate-800 text-white shadow-md shadow-black/20 ring-1 ring-white/10' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                 >
                   {isActive && (
                     <span className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-lg ${tab.color}`}></span>
                   )}
                   <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? tab.text : 'opacity-70'}`} strokeWidth={isActive ? 2.5 : 2} />
                   <span className={isActive ? 'opacity-100' : 'opacity-90'}>{tab.label}</span>
                 </button>
               );
             })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-8 px-4 md:px-6">
        
        {view === 'ratio' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-2 animate-pulse"></span>
                PvP編成シミュレーター
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                兵士比率カリキュレーター
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                敵の構成に合わせて、勝率を最大化する兵士配分を自動計算します。
              </p>
            </div>
            <TroopRatioCalculator />
           </div>
        )}

        {view === 'mobilization' && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-pulse"></span>
                同盟イベント攻略
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                同盟総動員クエスト推奨
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                手持ちのアイテムとプレイスタイルから、効率の良いクエストとクエスト回数を自動で選定します。
              </p>
              <p className="text-xs text-slate-500 mt-2 bg-slate-900/50 inline-block px-3 py-1 rounded-lg border border-white/5">
                 ※兵士訓練/昇格、領主装備はまだ未対応です
              </p>
            </div>
            <MobilizationGuide />
           </div>
        )}

        {view === 'speedup' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                最強領主イベント攻略
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                加速アイテム最適化
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                「総力上昇」と「加速消費」<br />どのイベントで加速を使うべきか瞬時に判定します。
              </p>
            </div>
            <Calculator />
          </div>
        )}

        {view === 'resource' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                資源最適化ツール
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                資源バランス診断
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                手持ちの資源比率（20:20:4:1）をチェックし、<br />不足している資源を特定します。
              </p>
            </div>
            <ResourceManager />
          </div>
        )}

        {view === 'giftcode' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                報酬受け取り
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">
                ギフトコード交換
              </h2>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
                最新のコードを確認して、ゲーム内アイテムを無料で獲得しましょう。
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              
              {/* Main Code Card */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
                <div className="relative bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl text-center">
                  <h3 className="text-emerald-400 font-bold tracking-widest uppercase mb-4 text-sm flex items-center justify-center gap-2">
                    <Gift className="w-4 h-4 animate-bounce" /> New Gift Code
                  </h3>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
                    <code className="text-3xl md:text-5xl font-black text-white font-mono tracking-tight bg-[#0B1120] px-6 py-4 rounded-xl border border-white/5 shadow-inner">
                      {LATEST_CODE.code}
                    </code>
                  </div>
                  <button 
                    onClick={() => handleCopyCode(LATEST_CODE.code)}
                    className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all active:scale-95 ${
                      isCopied 
                        ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                        : 'bg-white text-slate-900 hover:bg-emerald-50'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-5 h-5" />
                        コピーしました！
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        コードをコピー
                      </>
                    )}
                  </button>
                  <p className="text-xs text-emerald-300/80 mt-4 flex items-center justify-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    有効期限: {LATEST_CODE.limit}まで
                  </p>
                </div>
              </div>

              {/* Instructions Steps */}
              <div className="bg-[#0F172A]/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 md:p-8">
                 <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                   <Info className="w-6 h-6 text-emerald-400" />
                   ギフトコードの使い方
                 </h3>

                 <div className="space-y-6 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800 -z-10 hidden md:block"></div>

                    {/* Step 1 */}
                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-slate-300 relative z-10">1</div>
                       <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <h4 className="font-bold text-slate-200 mb-2">公式サイトへアクセス</h4>
                          <p className="text-sm text-slate-400 mb-3">
                            Century Gamesの公式ギフトコード交換サイトを開きます。
                          </p>
                          <a 
                            href="https://ks-giftcode.centurygame.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 transition-colors"
                          >
                            交換サイトを開く
                            <ExternalLink className="w-4 h-4" />
                          </a>
                       </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-slate-300 relative z-10">2</div>
                       <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <h4 className="font-bold text-slate-200 mb-2">IDを確認して入力</h4>
                          <p className="text-sm text-slate-400 leading-relaxed mb-4">
                             自分の<span className="text-white font-bold">プレイヤーID</span>と、コピーした<span className="text-white font-bold">ギフトコード</span>を入力します。
                          </p>
                          
                          <div className="bg-[#0B1120] rounded-lg p-4 border border-white/5">
                             <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <User className="w-3 h-3" /> IDの確認方法
                             </h5>
                             <ul className="text-sm text-slate-300 space-y-2">
                               <li className="flex items-start gap-2">
                                 <span className="bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                                 ゲーム画面左上の「自分のアイコン」をタップ
                               </li>
                               <li className="flex items-start gap-2">
                                 <span className="bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                                 名前の下にある「ID」の右側の数字を確認
                               </li>
                               <li className="flex items-start gap-2">
                                 <span className="bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                                 <span>
                                   数字横の <span className="inline-block p-0.5 bg-slate-600 rounded mx-1"><Copy className="w-3 h-3" /></span> をタップしてコピー
                                 </span>
                               </li>
                             </ul>
                          </div>
                       </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col md:flex-row gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-bold text-slate-300 relative z-10">3</div>
                       <div className="flex-1 bg-slate-900/50 rounded-xl p-4 border border-white/5">
                          <h4 className="font-bold text-slate-200 mb-2">交換完了！</h4>
                          <p className="text-sm text-slate-400">
                             サイトで「交換」ボタンを押すと、ゲーム内のメールに報酬が届きます。
                          </p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Active & Past Codes Section */}
              <div className="bg-[#0F172A]/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-500" />
                  その他のコード一覧
                </h3>
                
                <div className="grid gap-3">
                  {OTHER_CODES.map((item) => (
                    <div key={item.code} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                           <code className="font-mono font-bold px-1 text-slate-300">{item.code}</code>
                        </div>
                        <div className="text-[10px] text-slate-500 pl-1">{item.limit}</div>
                      </div>
                      <button 
                        onClick={() => handleCopyPastCode(item.code)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                          copiedPastCode === item.code
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20'
                        }`}
                      >
                        {copiedPastCode === item.code ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPastCode === item.code ? 'コピー済' : 'コピー'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0B1120]/50 backdrop-blur-sm py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">© 2026 Kingshot Optimizer. Unofficial Tool. v0.25.0</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
