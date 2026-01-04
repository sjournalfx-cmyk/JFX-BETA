import React, { useMemo, useState } from 'react';
import { Trade, UserProfile } from '../types';
import { 
  TrendingUp, PieChart, Info, ArrowUpRight, ArrowDownRight, Activity, 
  Target, BarChart3, Award, AlertOctagon,
  ArrowLeftRight, GitCompare, MoreVertical, Star, Coins,
  LayoutDashboard, LineChart, ShieldAlert
} from 'lucide-react';

interface AnalyticsProps {
  isDarkMode: boolean;
  trades: Trade[];
  userProfile: UserProfile;
}

const ExecutionPerformanceTable = ({ trades, isDarkMode, currencySymbol }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    return (
        <div className={`rounded-[24px] border overflow-hidden transition-all ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-500 bg-zinc-900/50' : 'text-slate-400 bg-slate-50/50'}`}>
                        <th className="px-6 py-4 font-bold">Outcome</th>
                        <th className="px-6 py-4 font-bold">Pair</th>
                        <th className="px-6 py-4 font-bold">Entry Comment</th>
                        <th className="px-6 py-4 font-bold text-right">PnL</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/10 dark:divide-zinc-800/50">
                    {trades.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center opacity-30 text-sm italic">No execution data available</td></tr>
                    ) : (
                        trades.slice(0, 10).map((trade) => {
                            const isWin = trade.result === 'Win';
                            const isLoss = trade.result === 'Loss';
                            const textColor = isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : (isDarkMode ? 'text-zinc-400' : 'text-slate-500');

                            return (
                                <tr key={trade.id} className="transition-colors hover:brightness-95 cursor-default">
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${isWin ? 'bg-emerald-500/10 text-emerald-500' : isLoss ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                            {trade.result}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-sm font-bold">{trade.pair}</td>
                                    <td className={`px-6 py-3 text-xs opacity-70 truncate max-w-xs`}>
                                        {trade.notes || '---'}
                                    </td>
                                    <td className={`px-6 py-3 text-sm font-mono font-bold text-right ${textColor}`}>
                                        {trade.pnl > 0 ? '+' : trade.pnl < 0 ? '-' : ''}{currencySymbol}{Math.abs(trade.pnl).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

const MonthlyPerformanceWidget = ({ trades, isDarkMode, currencySymbol }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const data = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        
        return months.map((month, idx) => {
            const monthTrades = trades.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            });

            const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);
            const drawdown = monthTrades.length > 0 ? Math.min(...monthTrades.map(t => t.pnl), 0) : 0;
            
            return { month, pnl, dd: drawdown, hasTrades: monthTrades.length > 0 };
        }).filter(d => d.hasTrades || new Date().getMonth() >= months.indexOf(d.month));
    }, [trades]);

    const allPnl = data.map(d => d.pnl);
    const allDd = data.map(d => d.dd);
    const maxVal = Math.max(...allPnl, 100);
    const minVal = Math.min(...allDd, -100);
    const range = maxVal - minVal || 1;
    const zeroY = (maxVal / range) * 100;

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight">Monthly P&L vs Maximum Drawdown</h3>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 relative mt-4 px-10 pb-12">
                <div className="absolute inset-0 left-10 right-2 bottom-12 flex flex-col justify-between pointer-events-none">
                    {[0, 0.25, 0.5, 0.75, 1].map(i => (
                        <div key={i} className="w-full border-t border-dashed border-white/5 h-0" />
                    ))}
                </div>

                <div className="relative h-full flex items-end justify-between px-4">
                    <div className="absolute left-0 right-0 border-t border-white/20 z-10" style={{ top: `${zeroY}%` }} />
                    
                    {data.map((d, i) => {
                        const pnlHeight = (Math.abs(d.pnl) / range) * 100;
                        const ddHeight = (Math.abs(d.dd) / range) * 100;
                        const isNegPnl = d.pnl < 0;

                        return (
                            <div key={i} className="relative flex flex-col items-center flex-1 h-full">
                                {d.hasTrades && (
                                    <>
                                        <div 
                                            className={`absolute w-6 rounded-t-lg transition-all duration-1000 ${isNegPnl ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                            style={{ 
                                                height: `${pnlHeight}%`, 
                                                bottom: isNegPnl ? `${100 - zeroY - pnlHeight}%` : `${100 - zeroY}%`,
                                                zIndex: 5
                                            }}
                                        />
                                        <div 
                                            className="absolute w-6 bg-amber-500 rounded-b-lg transition-all duration-1000 opacity-50"
                                            style={{ 
                                                height: `${ddHeight}%`, 
                                                top: `${zeroY}%`,
                                                zIndex: 4
                                            }}
                                        />
                                    </>
                                )}
                                <span className="absolute top-full mt-4 text-[10px] font-bold opacity-40">{d.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-center gap-8 mt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Net P&L</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Max Drawdown</span>
                </div>
            </div>
        </div>
    );
};

const CurrencyStrengthMeter = ({ isDarkMode, trades }: { isDarkMode: boolean, trades: Trade[] }) => {
    const strengths = useMemo(() => {
        const scores: Record<string, number> = {};
        const currencies = new Set<string>();
        const commonQuotes = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'USDT', 'BTC', 'ETH'];

        trades.forEach(trade => {
            let base = '';
            let quote = '';
            
            let pair = trade.pair.trim().toUpperCase();
            
            // 1. Try separators first (Slash, hyphen, space)
            const separatorMatch = pair.match(/^([A-Z0-9]+)[\/\-\s]([A-Z0-9]+)$/);
            if (separatorMatch) {
                base = separatorMatch[1];
                quote = separatorMatch[2];
            } else {
                // 2. Clean pair for length-based or suffix logic
                const cleanPair = pair.replace(/[^A-Z0-9]/g, '');
                
                if (cleanPair.length === 6) {
                    // Standard Forex (EURUSD)
                    base = cleanPair.substring(0, 3);
                    quote = cleanPair.substring(3, 6);
                } else {
                    // 3. Try suffix matching for crypto/indices (e.g. BTCUSD, US30USD - rare but possible)
                    for (const q of commonQuotes) {
                        if (cleanPair.endsWith(q) && cleanPair.length > q.length) {
                            quote = q;
                            base = cleanPair.substring(0, cleanPair.length - q.length);
                            break;
                        }
                    }
                }
            }
            
            // If still no parse, skip
            if (!base || !quote) return;

            currencies.add(base);
            currencies.add(quote);

            if (!scores[base]) scores[base] = 0;
            if (!scores[quote]) scores[quote] = 0;

            const pnl = trade.pnl;
            const direction = trade.direction.toLowerCase();

            if (direction === 'long' || direction === 'buy') {
                scores[base] += pnl;
                scores[quote] -= pnl;
            } else if (direction === 'short' || direction === 'sell') {
                scores[base] -= pnl;
                scores[quote] += pnl;
            }
        });

        const currencyList = Array.from(currencies);
        if (currencyList.length === 0) return [];

        const vals = Object.values(scores);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min;

        return currencyList.map(cur => {
            const val = scores[cur];
            // Normalize to 0-10
            const strength = range === 0 ? 5 : ((val - min) / range) * 10;
            return { cur, val: strength, raw: val };
        }).sort((a, b) => b.val - a.val).slice(0, 8); 
    }, [trades]);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Currency Strength</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Relative Performance</p>
                </div>
                <MoreVertical size={16} className="opacity-30" />
            </div>
            
            {strengths.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                    <Coins size={32} className="mb-3" />
                    <p className="text-sm">No currency data available</p>
                    <p className="text-xs mt-2 max-w-[200px]">Add trades with standard pairs (e.g. EURUSD) to see data.</p>
                </div>
            ) : (
                <div className="space-y-4 flex-1 justify-center flex flex-col">
                    {strengths.map((item) => (
                        <div key={item.cur} className="flex items-center gap-3">
                            <div className="w-12 flex flex-col items-center">
                                <span className="text-xs font-black">{item.cur}</span>
                            </div>
                            <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                        item.val > 7 ? 'bg-emerald-500' : 
                                        item.val > 4 ? 'bg-blue-500' : 
                                        item.val > 2 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} 
                                    style={{ width: `${Math.max(5, item.val * 10)}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-bold opacity-50 w-8 text-right">
                                {item.val.toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TradeExitAnalysisWidget = ({ trades, isDarkMode }: { trades: Trade[], isDarkMode: boolean }) => {
    const exitData = useMemo(() => {
        const total = trades.length || 1;
        const tp = trades.filter(t => t.result === 'Win').length;
        const sl = trades.filter(t => t.result === 'Loss').length;
        const be = trades.filter(t => t.result === 'BE').length;
        const pending = trades.filter(t => t.result === 'Pending').length;
        
        const data = [
            { label: 'Take Profit', key: 'TP', value: tp, color: '#10b981' },
            { label: 'Stop Loss', key: 'SL', value: sl, color: '#f43f5e' },
            { label: 'Breakeven', key: 'BE', value: be, color: '#71717a' },
            { label: 'Pending', key: 'P', value: pending, color: '#3b82f6' },
        ];

        let cumulativePercent = 0;
        return data.map(d => {
            const percent = (d.value / total) * 100;
            const startPercent = cumulativePercent;
            cumulativePercent += percent;
            return { ...d, percent, startPercent };
        });
    }, [trades]);

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight">Trade Exit Analysis</h3>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-64 h-64 transform -rotate-90">
                    {exitData.map((d, i) => {
                        if (d.percent === 0) return null;
                        const [startX, startY] = getCoordinatesForPercent(d.startPercent / 100);
                        const [endX, endY] = getCoordinatesForPercent((d.startPercent + d.percent) / 100);
                        const largeArcFlag = d.percent > 50 ? 1 : 0;
                        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                        return (
                            <path key={i} d={pathData} fill={d.color} className="transition-all duration-300 hover:opacity-80 cursor-pointer" />
                        );
                    })}
                </svg>
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 w-full px-4">
                    {exitData.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-sm font-bold opacity-80 whitespace-nowrap">{d.label}: {d.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EquityCurveWidget = ({ trades, equityData, isDarkMode, currencySymbol }: { trades: Trade[], equityData: number[], isDarkMode: boolean, currencySymbol: string }) => {
    const generatePath = (data: number[], width: number, height: number) => {
        if (data.length < 2) return "";
        const min = Math.min(...data, 0); 
        const max = Math.max(...data, 100); 
        const range = max - min || 1;
        const points = data.map((val, i) => { 
            const x = (i / (data.length - 1)) * width; 
            const y = height - ((val - min) / range) * height; 
            return `${x},${y}`; 
        });
        return `M ${points.join(' L ')}`;
    };

    const currentNet = equityData.length > 0 ? equityData[equityData.length - 1] : 0;

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col min-h-[380px] relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Equity Curve</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1.5">Cumulative P&L Growth</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-mono font-black ${currentNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {currentNet >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(currentNet).toLocaleString()}
                    </span>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">Current Net</p>
                </div>
            </div>
            <div className="flex-1 relative mt-4">
                {equityData.length > 1 ? (
                    <svg viewBox="0 0 800 240" className="w-full h-full overflow-visible drop-shadow-2xl">
                        <defs><linearGradient id="curveGradientAnalytics" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" /><stop offset="100%" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (<line key={i} x1="0" y1={p * 240} x2="800" y2={p * 240} stroke="currentColor" strokeOpacity="0.05" />))}
                        <path d={generatePath(equityData, 800, 240)} fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={`${generatePath(equityData, 800, 240)} L 800,240 L 0,240 Z`} fill="url(#curveGradientAnalytics)" />
                    </svg>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4"><Activity size={48} strokeWidth={1} /><p className="text-sm font-medium">Insufficient trade data to generate curve</p></div>
                )}
            </div>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ isDarkMode, trades, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'efficiency'>('overview');
  
  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === 'Win');
    const losses = trades.filter(t => t.result === 'Loss');
    const totalCount = trades.length || 1;
    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
    const netProfit = grossProfit - grossLoss;
    
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0;
    
    const winRate = (wins.length / totalCount) * 100;
    
    return {
      netProfit,
      grossProfit,
      grossLoss,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      avgWin,
      avgLoss,
      rrRatio: riskRewardRatio.toFixed(2),
      totalTrades: trades.length
    };
  }, [trades]);

  const equityData = useMemo(() => {
    let cumulative = 0;
    const data = [0];
    
    [...trades]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        
    return data;
  }, [trades]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'growth', label: 'Growth', icon: LineChart },
    { id: 'efficiency', label: 'Efficiency', icon: Target }
  ] as const;

  return (
    <div className={`w-full h-full overflow-y-auto custom-scrollbar p-6 lg:p-10 font-sans ${isDarkMode ? 'bg-[#050505] text-zinc-200' : 'bg-[#F8FAFC] text-slate-900'}`}>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Performance Analytics</h1>
            <p className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Visual breakdown of your trading performance.</p>
        </div>
        
        <div className={`flex p-1 gap-1 ${isDarkMode ? 'bg-[#121214] rounded-[20px] border border-[#1e1e22]' : 'bg-slate-100 rounded-[20px] border border-slate-200'}`}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex items-center gap-3 px-5 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                            isActive 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-zinc-500 hover:text-indigo-500'
                        }`}
                    >
                        <tab.icon size={16} strokeWidth={isActive ? 3 : 2} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
      </header>

      {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-500 space-y-8 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Win Rate</span>
                    <div className="text-2xl font-black">{stats.winRate}%</div>
                    <div className="mt-2 h-1 w-full bg-indigo-500/20 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${stats.winRate}%` }} />
                    </div>
                </div>
                <div className={`p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profit Factor</span>
                    <div className="text-2xl font-black">{stats.profitFactor}</div>
                    <div className={`mt-2 h-1 w-full rounded-full overflow-hidden ${parseFloat(stats.profitFactor) >= 1 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                        <div className={`h-full ${parseFloat(stats.profitFactor) >= 1 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(100, parseFloat(stats.profitFactor) * 50)}%` }} />
                    </div>
                </div>
                <div className={`p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Profit</span>
                    <div className="text-2xl font-black text-emerald-500">+{userProfile.currencySymbol}{stats.grossProfit.toLocaleString()}</div>
                </div>
                <div className={`p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Loss</span>
                    <div className="text-2xl font-black text-rose-500">-{userProfile.currencySymbol}{stats.grossLoss.toLocaleString()}</div>
                </div>
              </div>

              <EquityCurveWidget trades={trades} equityData={equityData} isDarkMode={isDarkMode} currencySymbol={userProfile.currencySymbol} />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <MonthlyPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={userProfile.currencySymbol} />
                <CurrencyStrengthMeter isDarkMode={isDarkMode} trades={trades} />
                <TradeExitAnalysisWidget trades={trades} isDarkMode={isDarkMode} />
              </div>
          </div>
      )}

      {activeTab === 'growth' && (
          <div className="animate-in fade-in duration-500 space-y-8 pb-20">
              <div className={`p-5 rounded-[24px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center gap-2 mb-4">
                      <PieChart size={16} className="text-teal-500" />
                      <h3 className="font-bold text-sm uppercase tracking-wide opacity-80">Outcome Distribution</h3>
                  </div>
                  <div className="flex items-center justify-center gap-8 py-2">
                    <div className="relative w-24 h-24">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={isDarkMode ? "#27272a" : "#f1f5f9"} strokeWidth="3" />
                            <circle 
                                cx="18" 
                                cy="18" 
                                r="15.915" 
                                fill="transparent" 
                                stroke="#10b981" 
                                strokeWidth="3" 
                                strokeDasharray={`${stats.winRate}, 100`}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-black">{stats.winRate}%</span>
                        </div>
                    </div>
                    <div className="w-full max-w-[140px] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium opacity-60">Total</span>
                            <span className="font-bold">{stats.totalTrades}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-emerald-500">Wins</span>
                            <span className="font-bold">{trades.filter(t => t.result === 'Win').length}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-rose-500">Losses</span>
                            <span className="font-bold">{trades.filter(t => t.result === 'Loss').length}</span>
                        </div>
                    </div>
                  </div>
              </div>
              <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest opacity-50 px-4">Recent Execution Performance</h3>
                  <ExecutionPerformanceTable trades={trades} isDarkMode={isDarkMode} currencySymbol={userProfile.currencySymbol} />
              </div>
          </div>
      )}

      {activeTab === 'efficiency' && (
          <div className="animate-in fade-in duration-500 space-y-8 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <Activity size={20} className="text-indigo-500" />
                          Risk/Reward Efficiency
                      </h3>
                      <div className="space-y-6">
                          <div className="flex justify-between items-end">
                              <span className="text-sm opacity-60">Avg Win</span>
                              <span className="text-xl font-black text-emerald-500">{userProfile.currencySymbol}{Math.round(stats.avgWin).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-end">
                              <span className="text-sm opacity-60">Avg Loss</span>
                              <span className="text-xl font-black text-rose-500">{userProfile.currencySymbol}{Math.round(stats.avgLoss).toLocaleString()}</span>
                          </div>
                          <div className="pt-6 border-t border-dashed border-white/10 flex justify-between items-end">
                              <span className="text-sm font-bold">Expectancy (R:R)</span>
                              <span className="text-2xl font-black text-indigo-500">1 : {stats.rrRatio}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                          <ShieldAlert size={20} className="text-amber-500" />
                          Behavioral Insights
                      </h3>
                      <div className="space-y-4">
                          {/* Placeholder for real mistake analysis if you log mistakes */}
                          <div className="opacity-40 italic text-sm text-center py-10">
                              Continue logging trade mistakes to see behavioral analysis here.
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Analytics;