import React, { useMemo, useState, useEffect } from 'react';
import { Trade, UserProfile } from '../types';
import {
    TrendingUp, PieChart, Info, ArrowUpRight, ArrowDownRight, Activity,
    Target, BarChart3, Award, AlertOctagon,
    ArrowLeftRight, GitCompare, MoreVertical, Star, Coins,
    LayoutDashboard, LineChart, ShieldAlert, X, HelpCircle, GripVertical,
    ArrowRightLeft, Crown, Flame, Snowflake
} from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableWidget } from './ui/SortableWidget';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Select } from './Select';

interface AnalyticsProps {
    isDarkMode: boolean;
    trades: Trade[];
    userProfile: UserProfile;
    eaSession?: any;
}

const ComparisonView = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const symbols = useMemo(() => {
        const uniqueSymbols = Array.from(new Set(trades.map(t => t.pair.toUpperCase()))).sort();
        return uniqueSymbols.map(s => ({ value: s, label: s }));
    }, [trades]);

    const dateRanges = [
        { value: 'all', label: 'All Time' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_year', label: 'This Year' }
    ];

    const [symbolA, setSymbolA] = useState(symbols[0]?.value || '');
    const [symbolB, setSymbolB] = useState(symbols[1]?.value || '');
    const [rangeA, setRangeA] = useState('all');
    const [rangeB, setRangeB] = useState('all');

    const filterByRange = (tradeList: Trade[], range: string) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return tradeList.filter(t => {
            const tradeDate = new Date(t.date);
            if (range === 'this_month') return tradeDate >= startOfMonth;
            if (range === 'last_month') return tradeDate >= startOfLastMonth && tradeDate <= endOfLastMonth;
            if (range === 'this_year') return tradeDate >= startOfYear;
            return true;
        });
    };

    const getPreviousTrades = (tradeList: Trade[], range: string) => {
        const now = new Date();
        if (range === 'all') return [];

        if (range === 'this_month') {
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfLastMonth && d <= endOfLastMonth;
            });
        }

        if (range === 'last_month') {
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 0);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevMonth && d <= endOfPrevMonth;
            });
        }

        if (range === 'this_year') {
            const startOfPrevYear = new Date(now.getFullYear() - 1, 0, 1);
            const endOfPrevYear = new Date(now.getFullYear() - 1, 11, 31);
            return tradeList.filter(t => {
                const d = new Date(t.date);
                return d >= startOfPrevYear && d <= endOfPrevYear;
            });
        }

        return [];
    };

    const tradesA = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolA);
        return filterByRange(filtered, rangeA);
    }, [trades, symbolA, rangeA]);

    const tradesB = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolB);
        return filterByRange(filtered, rangeB);
    }, [trades, symbolB, rangeB]);

    const prevTradesA = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolA);
        return getPreviousTrades(filtered, rangeA);
    }, [trades, symbolA, rangeA]);

    const prevTradesB = useMemo(() => {
        const filtered = trades.filter(t => t.pair.toUpperCase() === symbolB);
        return getPreviousTrades(filtered, rangeB);
    }, [trades, symbolB, rangeB]);

    const getStats = (tradesList: Trade[]) => {
        const wins = tradesList.filter(t => t.result === 'Win');
        const losses = tradesList.filter(t => t.result === 'Loss');
        const total = tradesList.length || 1;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netProfit = grossProfit - grossLoss;
        const winRate = (wins.length / total) * 100;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);
        
        return { netProfit, winRate, profitFactor, total: tradesList.length };
    };

    const statsA = getStats(tradesA);
    const statsB = getStats(tradesB);
    const prevStatsA = getStats(prevTradesA);
    const prevStatsB = getStats(prevTradesB);

    const getTrendData = (current: number, previous: number) => {
        if (previous === 0) return { direction: null, percent: null };
        const diff = current - previous;
        const percent = (diff / Math.abs(previous)) * 100;
        return { 
            direction: diff >= 0 ? 'up' : 'down', 
            percent: Math.abs(percent).toFixed(1)
        };
    };

    const trendA = getTrendData(statsA.netProfit, prevStatsA.netProfit);
    const trendB = getTrendData(statsB.netProfit, prevStatsB.netProfit);

    const getEquityData = (tradesList: Trade[]) => {
        let cumulative = 0;
        const data = [0];
        const sorted = [...tradesList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        return data;
    };

    const equityA = getEquityData(tradesA);
    const equityB = getEquityData(tradesB);

    const maxVal = Math.max(...equityA, ...equityB, 100);
    const minVal = Math.min(...equityA, ...equityB, -100);
    const range = maxVal - minVal || 1;

    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - minVal) / range) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Symbol A"
                        value={symbolA}
                        onChange={setSymbolA}
                        options={symbols}
                        isDarkMode={isDarkMode}
                        icon={Coins}
                    />
                    <Select
                        label="Period A"
                        value={rangeA}
                        onChange={setRangeA}
                        options={dateRanges}
                        isDarkMode={isDarkMode}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Select
                        label="Symbol B"
                        value={symbolB}
                        onChange={setSymbolB}
                        options={symbols}
                        isDarkMode={isDarkMode}
                        icon={Coins}
                    />
                    <Select
                        label="Period B"
                        value={rangeB}
                        onChange={setRangeB}
                        options={dateRanges}
                        isDarkMode={isDarkMode}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { 
                        label: symbolA, 
                        stats: statsA, 
                        trend: trendA,
                        color: 'text-indigo-500', 
                        bg: 'bg-indigo-500/10', 
                        range: rangeA,
                        isWinner: {
                            netProfit: statsA.netProfit > statsB.netProfit,
                            winRate: statsA.winRate > statsB.winRate,
                            profitFactor: parseFloat(statsA.profitFactor) > parseFloat(statsB.profitFactor),
                            total: statsA.total > statsB.total
                        }
                    },
                    { 
                        label: symbolB, 
                        stats: statsB, 
                        trend: trendB,
                        color: 'text-amber-500', 
                        bg: 'bg-amber-500/10', 
                        range: rangeB,
                        isWinner: {
                            netProfit: statsB.netProfit > statsA.netProfit,
                            winRate: statsB.winRate > statsA.winRate,
                            profitFactor: parseFloat(statsB.profitFactor) > parseFloat(statsA.profitFactor),
                            total: statsB.total > statsA.total
                        }
                    }
                ].map((panel, idx) => (
                    <div key={idx} className={`p-8 rounded-[32px] border relative overflow-hidden ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl ${panel.bg} ${panel.color}`}><BarChart3 size={20} /></div>
                                <div>
                                    <h3 className="text-xl font-bold">{panel.label || 'Select Symbol'}</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">{dateRanges.find(r => r.value === panel.range)?.label}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Net Profit
                                    {panel.isWinner.netProfit && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className={`text-2xl font-black ${panel.stats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {panel.stats.netProfit >= 0 ? '+' : ''}{currencySymbol}{panel.stats.netProfit.toLocaleString()}
                                    </div>
                                    {panel.trend.direction && (
                                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${panel.trend.direction === 'up' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {panel.trend.direction === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {panel.trend.percent}%
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Win Rate
                                    {panel.isWinner.winRate && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.winRate.toFixed(1)}%</div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Profit Factor
                                    {panel.isWinner.profitFactor && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.profitFactor}</div>
                            </div>
                            <div className="space-y-1 relative">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1">
                                    Total Trades
                                    {panel.isWinner.total && <Crown size={10} className="text-amber-500" />}
                                </span>
                                <div className="text-2xl font-black">{panel.stats.total}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold tracking-tight">Comparative Equity Curve</h3>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{symbolA}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{symbolB}</span>
                        </div>
                    </div>
                </div>
                <div className="h-[300px] w-full relative">
                    <svg viewBox="0 0 800 300" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                            <line key={i} x1="0" y1={p * 300} x2="800" y2={p * 300} stroke="currentColor" strokeOpacity="0.05" />
                        ))}
                        <path d={generatePath(equityA, 800, 300)} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                        <path d={generatePath(equityB, 800, 300)} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

const ExecutionPerformanceTable = ({ trades = [], isDarkMode, currencySymbol = '$', initialBalance = 0 }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string, initialBalance: number }) => {
    const stripHtml = (html: string) => {
        if (!html) return "All Rules";
        const text = html.replace(/<[^>]*>?/gm, '').trim();
        return text || "All Rules";
    };

    const getCommentColor = (text: string) => {
        if (text.toLowerCase() === 'all rules') return 'text-emerald-500';
        return '';
    };

    const sortedTrades = useMemo(() => {
        const safeTrades = trades || [];
        return [...safeTrades].sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateB - dateA;
        }).slice(0, 15);
    }, [trades]);

    return (
        <div className={`rounded-[24px] overflow-hidden border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className={`text-[10px] font-bold uppercase tracking-widest opacity-40 ${isDarkMode ? 'bg-zinc-900/50 text-zinc-500' : 'bg-slate-50 text-slate-400'}`}>
                            <th className="px-6 py-5 font-bold">Tiltmeter</th>
                            <th className="px-6 py-5 font-bold">Entry Comment</th>
                            <th className="px-6 py-5 font-bold">Exit Comment</th>
                            <th className="px-6 py-5 text-right font-bold">Return (%)</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                        {sortedTrades.map((trade) => {
                            const returnPercent = initialBalance > 0 ? (trade.pnl / initialBalance) * 100 : 0;
                            const isWin = trade.pnl > 0;
                            const absReturn = Math.abs(returnPercent);
                            const barWidth = Math.min(40, absReturn * 2);

                            const entryComment = stripHtml(trade.notes || "");
                            const exitComment = stripHtml(trade.exitComment || "");

                            return (
                                <tr key={trade.id} className={`group transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="relative flex items-center h-4 w-20 justify-center">
                                                <div className={`absolute w-1.5 h-4 rounded-full z-10 ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-300'}`} />
                                                <div
                                                    className={`absolute h-1.5 rounded-full transition-all duration-700 ${isWin ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]'}`}
                                                    style={{
                                                        width: `${barWidth}px`,
                                                        left: isWin ? '50%' : 'auto',
                                                        right: isWin ? 'auto' : '50%',
                                                        transform: isWin ? 'translateX(4px)' : 'translateX(-4px)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold ${getCommentColor(entryComment)}`}>
                                            {entryComment}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`text-xs font-bold ${getCommentColor(exitComment)}`}>
                                            {exitComment}
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-right text-xs font-mono font-black ${isWin ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {returnPercent.toFixed(2)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MonthlyPerformanceWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

    const data = useMemo(() => {
        const safeTrades = trades || [];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();

        return months.map((month, idx) => {
            const monthTrades = safeTrades.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === idx && d.getFullYear() === currentYear;
            }).sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

            const pnl = monthTrades.reduce((acc, t) => acc + t.pnl, 0);

            // Calculate Max Drawdown for the month
            let runningBalance = 0;
            let peakBalance = 0;
            let maxDrawdown = 0;

            monthTrades.forEach(t => {
                runningBalance += t.pnl;
                if (runningBalance > peakBalance) {
                    peakBalance = runningBalance;
                }
                const drawdown = runningBalance - peakBalance;
                if (drawdown < maxDrawdown) {
                    maxDrawdown = drawdown;
                }
            });

            return { month, pnl, dd: maxDrawdown, hasTrades: monthTrades.length > 0 };
        }).filter(d => d.hasTrades || new Date().getMonth() >= months.indexOf(d.month));
    }, [trades]);

    const allPnl = data.map(d => d.pnl);
    const allDd = data.map(d => d.dd);
    const maxVal = Math.max(...allPnl, 100);
    const minVal = Math.min(...allDd, -100);
    const range = maxVal - minVal || 1;
    const zeroY = (maxVal / range) * 100;

    const hoveredData = data.find(d => d.month === hoveredMonth);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
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
                        const isHovered = hoveredMonth === d.month;

                        return (
                            <div 
                                key={i} 
                                className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                onMouseEnter={() => setHoveredMonth(d.month)}
                                onMouseLeave={() => setHoveredMonth(null)}
                            >
                                {d.hasTrades && (
                                    <>
                                        <div
                                            className={`absolute w-6 rounded-t-lg transition-all duration-300 ${isNegPnl ? 'bg-rose-500' : 'bg-emerald-500'} ${isHovered ? 'w-8 brightness-110 shadow-lg' : ''}`}
                                            style={{
                                                height: `${pnlHeight}%`,
                                                bottom: isNegPnl ? `${100 - zeroY - pnlHeight}%` : `${100 - zeroY}%`,
                                                zIndex: 5
                                            }}
                                        />
                                        <div
                                            className={`absolute w-6 bg-amber-500 rounded-b-lg transition-all duration-300 ${isHovered ? 'w-8 opacity-80' : 'opacity-50'}`}
                                            style={{
                                                height: `${ddHeight}%`,
                                                top: `${zeroY}%`,
                                                zIndex: 4
                                            }}
                                        />
                                    </>
                                )}
                                <span className={`absolute top-full mt-4 text-[10px] font-bold transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>{d.month}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tooltip */}
            {hoveredData && hoveredData.hasTrades && (
                <div className={`absolute right-8 top-16 p-4 rounded-xl z-30 min-w-[160px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                    <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{hoveredData.month} Performance</div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="opacity-60">Net P&L</span>
                            <span className={`font-bold ${hoveredData.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {hoveredData.pnl >= 0 ? '+' : ''}{currencySymbol}{hoveredData.pnl.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-60">Max Drawdown</span>
                            <span className="text-amber-500 font-bold">-{currencySymbol}{Math.abs(hoveredData.dd).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

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

const CurrencyStrengthMeter = ({ isDarkMode, trades = [] }: { isDarkMode: boolean, trades: Trade[] }) => {
    const [hoveredCur, setHoveredCur] = useState<string | null>(null);

    const strengths = useMemo(() => {
        const safeTrades = trades || [];
        const scores: Record<string, number> = {};
        const currencies = new Set<string>();
        const commonQuotes = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'CHF', 'NZD', 'USDT', 'BTC', 'ETH'];

        safeTrades.forEach(trade => {
            let base = '';
            let quote = '';

            let pair = trade.pair ? trade.pair.trim().toUpperCase() : '';
            if (!pair) return;

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

            const pnl = trade.pnl || 0;
            const direction = trade.direction?.toLowerCase() || '';

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

    const hoveredData = strengths.find(s => s.cur === hoveredCur);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
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
                        <div 
                            key={item.cur} 
                            className="flex items-center gap-3 group cursor-pointer"
                            onMouseEnter={() => setHoveredCur(item.cur)}
                            onMouseLeave={() => setHoveredCur(null)}
                        >
                            <div className="w-12 flex flex-col items-center">
                                <span className={`text-xs font-black transition-colors ${hoveredCur === item.cur ? 'text-indigo-500' : ''}`}>{item.cur}</span>
                            </div>
                            <div className={`flex-1 h-2 rounded-full overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'} ${hoveredCur === item.cur ? 'h-3' : ''}`}>
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${item.val > 7 ? 'bg-emerald-500' :
                                            item.val > 4 ? 'bg-blue-500' :
                                                item.val > 2 ? 'bg-amber-500' : 'bg-rose-500'
                                        } ${hoveredCur === item.cur ? 'brightness-110 shadow-lg' : ''}`}
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

            {/* Tooltip */}
            {hoveredData && (
                <div className={`absolute right-8 top-16 p-4 rounded-xl z-30 min-w-[140px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                    <div className="font-bold text-sm mb-2 border-b border-white/10 pb-1">{hoveredData.cur} Strength</div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="opacity-60">Score</span>
                        <span className="font-bold">{hoveredData.val.toFixed(2)} / 10</span>
                    </div>
                </div>
            )}
        </div>
    );
};

const TradeExitAnalysisWidget = ({ trades = [], isDarkMode }: { trades: Trade[], isDarkMode: boolean }) => {
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const exitData = useMemo(() => {
        const safeTrades = trades || [];
        const total = safeTrades.length || 1;
        const tp = safeTrades.filter(t => t.result === 'Win').length;
        const sl = safeTrades.filter(t => t.result === 'Loss').length;
        const be = safeTrades.filter(t => t.result === 'BE').length;
        const pending = safeTrades.filter(t => t.result === 'Pending').length;

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

    const hoveredData = exitData.find(d => d.key === hoveredKey);

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[400px] relative ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold tracking-tight">Trade Exit Analysis</h3>
                <MoreVertical size={16} className="opacity-30" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-64 h-64 transform -rotate-90 overflow-visible">
                    {exitData.map((d, i) => {
                        if (d.percent === 0) return null;
                        const [startX, startY] = getCoordinatesForPercent(d.startPercent / 100);
                        const [endX, endY] = getCoordinatesForPercent((d.startPercent + d.percent) / 100);
                        const largeArcFlag = d.percent > 50 ? 1 : 0;
                        const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
                        const isHovered = hoveredKey === d.key;

                        return (
                            <path 
                                key={i} 
                                d={pathData} 
                                fill={d.color} 
                                className={`transition-all duration-300 cursor-pointer ${isHovered ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
                                style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)', transformOrigin: 'center' }}
                                onMouseEnter={() => setHoveredKey(d.key)}
                                onMouseLeave={() => setHoveredKey(null)}
                            />
                        );
                    })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredData && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`p-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                            <div className="text-center">
                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-0.5">{hoveredData.label}</div>
                                <div className="text-xl font-black" style={{ color: hoveredData.color }}>{hoveredData.percent.toFixed(1)}%</div>
                                <div className="text-[10px] font-bold opacity-40">{hoveredData.value} Trades</div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-8 w-full px-4">
                    {exitData.map((d, i) => (
                        <div key={i} className={`flex items-center gap-3 transition-all duration-300 ${hoveredKey === d.key ? 'scale-105' : 'opacity-80'}`}>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: d.color }} />
                            <span className="text-sm font-bold whitespace-nowrap">{d.label}: {d.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EquityCurveWidget = ({ trades = [], equityData = [], isDarkMode, currencySymbol = '$', currentBalanceOverride }: { trades: Trade[], equityData: number[], isDarkMode: boolean, currencySymbol: string, currentBalanceOverride?: number }) => {
    const generatePath = (data: number[], width: number, height: number) => {
        if (!data || data.length < 2) return "";
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        const points = data.map((val, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    const currentEquity = currentBalanceOverride !== undefined ? currentBalanceOverride : (equityData?.length > 0 ? equityData[equityData.length - 1] : 0);
    const initialEquity = equityData?.length > 0 ? equityData[0] : 0;
    const totalReturn = currentEquity - initialEquity;

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col min-h-[350px] relative overflow-hidden ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><TrendingUp size={20} /></div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">Equity Curve</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1.5">Account Balance Growth</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-2xl font-mono font-black ${totalReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {totalReturn >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(currentEquity).toLocaleString()}
                    </span>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-tighter">Current Balance</p>
                </div>
            </div>
            <div className="flex-1 relative mt-4">
                {equityData && equityData.length > 1 ? (
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




const PerformanceByPairWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoveredPair, setHoveredPair] = useState<string | null>(null);

    const pairData = useMemo(() => {
        const safeTrades = trades || [];
        const pairStats: Record<string, { profit: number; loss: number }> = {};

        safeTrades.forEach(trade => {
            if (!trade.pair) return;
            // Normalize pair name: remove special chars, uppercase
            const pair = trade.pair.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
            
            if (!pairStats[pair]) {
                pairStats[pair] = { profit: 0, loss: 0 };
            }
            if (trade.pnl > 0) {
                pairStats[pair].profit += trade.pnl;
            } else {
                pairStats[pair].loss += Math.abs(trade.pnl || 0);
            }
        });

        return Object.entries(pairStats)
            .map(([pair, stats]) => ({
                pair,
                profit: stats.profit,
                loss: stats.loss,
                net: stats.profit - stats.loss
            }))
            .sort((a, b) => b.net - a.net);
    }, [trades]);

    const allValues = pairData.flatMap(d => [d.profit, -d.loss]);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;
    
    // Add 10% padding to range for visuals
    const range = (maxVal - minVal) * 1.1 || 1;
    
    // Calculate zero line position (percentage from top)
    // Formula: The distance from maxVal to 0, divided by total range
    const zeroY = ((maxVal) / range) * 100;

    const hoveredData = hoveredPair ? pairData.find(d => d.pair === hoveredPair) : null;

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[450px] ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold tracking-tight">Performance by Pair</h3>
                <div className="flex items-center gap-3">
                    <HelpCircle size={16} className="opacity-40 cursor-pointer hover:opacity-80" />
                </div>
            </div>

            {pairData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center opacity-30 text-sm">No trade data available</div>
            ) : (
                <div className="flex-1 flex relative overflow-hidden">
                    {/* Fixed Y-Axis Labels */}
                    <div className={`w-14 flex flex-col justify-between text-[10px] font-mono opacity-40 py-4 h-full z-20 absolute left-0 top-0 bottom-4 border-r border-dashed ${isDarkMode ? 'bg-[#0d1117] border-white/5' : 'bg-white border-slate-200'}`}>
                        <span>{currencySymbol}{Math.round(maxVal)}</span>
                        <span>{currencySymbol}0</span>
                        <span>{currencySymbol}{Math.round(minVal)}</span>
                    </div>

                    {/* Scrollable Chart Area */}
                    <div className="flex-1 ml-14 overflow-x-auto custom-scrollbar relative">
                        <div 
                            className="h-full relative pb-8 px-4" 
                            style={{ width: `${Math.max(100, pairData.length * 80)}px`, minWidth: '100%' }} // Dynamic width
                        >
                            {/* Zero Line */}
                            <div 
                                className="absolute left-0 right-0 border-t border-white/20 z-10"
                                style={{ top: `${zeroY}%` }}
                            />

                            {/* Bars Container */}
                            <div className="absolute inset-0 top-0 bottom-8 flex items-end justify-around px-2">
                                {pairData.map((d, i) => {
                                    const profitHeight = (d.profit / range) * 100;
                                    const lossHeight = (d.loss / range) * 100;
                                    const isHovered = hoveredPair === d.pair;

                                    return (
                                        <div
                                            key={i}
                                            className="relative h-full flex flex-col items-center justify-start w-16 group cursor-pointer"
                                            onMouseEnter={() => setHoveredPair(d.pair)}
                                            onMouseLeave={() => setHoveredPair(null)}
                                        >
                                            {/* Hover Background */}
                                            {isHovered && (
                                                <div className="absolute inset-y-0 -inset-x-1 bg-indigo-500/5 rounded-lg z-0 pointer-events-none" />
                                            )}

                                            <div className="relative w-full h-full z-10">
                                                {/* Profit Bar */}
                                                {d.profit > 0 && (
                                                    <div
                                                        className={`absolute left-1/2 -translate-x-1/2 w-4 bg-emerald-500 rounded-t-sm transition-all duration-300 ${isHovered ? 'w-6 brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'opacity-90'}`}
                                                        style={{
                                                            height: `${profitHeight}%`,
                                                            bottom: `${100 - zeroY}%`,
                                                        }}
                                                    />
                                                )}

                                                {/* Loss Bar */}
                                                {d.loss > 0 && (
                                                    <div
                                                        className={`absolute left-1/2 -translate-x-1/2 w-4 bg-rose-500 rounded-b-sm transition-all duration-300 ${isHovered ? 'w-6 brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'opacity-90'}`}
                                                        style={{
                                                            height: `${lossHeight}%`,
                                                            top: `${zeroY}%`,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            
                                            {/* X-Axis Label */}
                                            <span className={`absolute bottom-[-24px] text-[9px] font-bold transition-all duration-300 whitespace-nowrap ${isHovered ? 'opacity-100 scale-110 text-indigo-500' : 'opacity-40'}`}>
                                                {d.pair}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Tooltip Overlay */}
                    {hoveredData && (
                        <div className={`absolute right-4 top-4 p-4 rounded-xl z-30 min-w-[160px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                            <div className="font-bold text-sm mb-3 border-b border-white/10 pb-2">{hoveredData.pair}</div>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="opacity-60">Profit</span>
                                    <span className="text-emerald-500 font-bold">+{currencySymbol}{hoveredData.profit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-60">Loss</span>
                                    <span className="text-rose-500 font-bold">-{currencySymbol}{hoveredData.loss.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-white/10 mt-2">
                                    <span className="font-bold opacity-80">Net</span>
                                    <span className={`font-bold ${hoveredData.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {hoveredData.net >= 0 ? '+' : ''}{currencySymbol}{hoveredData.net.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const LargestWinLossWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const { largestWin, largestLoss } = useMemo(() => {
        const safeTrades = trades || [];
        const wins = safeTrades.filter(t => t.pnl > 0);
        const losses = safeTrades.filter(t => t.pnl < 0);
        const largestWin = wins.length > 0 ? Math.max(...wins.map(t => t.pnl)) : 0;
        const largestLoss = losses.length > 0 ? Math.min(...losses.map(t => t.pnl)) : 0;
        return { largestWin, largestLoss: Math.abs(largestLoss) };
    }, [trades]);

    const maxValue = Math.max(largestWin, largestLoss) || 1;
    const winPercent = (largestWin / maxValue) * 100;
    const lossPercent = (largestLoss / maxValue) * 100;

    return (
        <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold tracking-tight">Largest Win vs Largest Loss</h3>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-bold">Largest Win</span>
                    <span className="text-emerald-500 font-mono font-bold">{currencySymbol}{largestWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-rose-500 font-bold">Largest Loss</span>
                    <span className="text-rose-500 font-mono font-bold">{currencySymbol}-{largestLoss.toFixed(2)}</span>
                </div>
                <div className={`h-3 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${winPercent}%` }} />
                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${lossPercent}%` }} />
                </div>
            </div>
        </div>
    );
};

const MomentumStreakWidget = ({ trades = [], isDarkMode }: { trades: Trade[], isDarkMode: boolean }) => {
    const stats = useMemo(() => {
        const sortedTrades = [...trades].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
        
        let longestWin = 0;
        let longestLoss = 0;
        let tempWin = 0;
        let tempLoss = 0;

        sortedTrades.forEach(t => {
            if (t.result === 'Win') {
                tempWin++;
                tempLoss = 0;
                if (tempWin > longestWin) longestWin = tempWin;
            } else if (t.result === 'Loss') {
                tempLoss++;
                tempWin = 0;
                if (tempLoss > longestLoss) longestLoss = tempLoss;
            } else {
                tempWin = 0;
                tempLoss = 0;
            }
        });

        // Current streak
        let currentStreakValue = 0;
        let currentStreakType: 'Win' | 'Loss' | 'BE' | 'Pending' | null = null;
        
        const lastTrades = [...sortedTrades].reverse();
        if (lastTrades.length > 0) {
            currentStreakType = lastTrades[0].result;
            for (const t of lastTrades) {
                if (t.result === currentStreakType) {
                    currentStreakValue++;
                } else {
                    break;
                }
            }
        }

        // Recovery message logic
        const wasLossStreak = lastTrades.length > 1 && lastTrades[1].result === 'Loss';
        const isRecovery = lastTrades.length > 0 && lastTrades[0].result === 'Win' && wasLossStreak;
        const recoveredAmount = isRecovery ? lastTrades[0].pnl : 0;

        // Weekly Progress Logic
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const tradesThisWeek = trades.filter(t => new Date(t.date) >= startOfWeek).length;
        const weeklyGoal = 15;
        const weeklyProgress = Math.min(100, (tradesThisWeek / weeklyGoal) * 100);

        return { longestWin, longestLoss, currentStreakType, currentStreakValue, isRecovery, tradesThisWeek, weeklyGoal, weeklyProgress, recent: sortedTrades.slice(-48) };
    }, [trades]);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col h-full min-h-[320px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold tracking-tight">Trade Momentum</h3>
                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 mt-1">Outcome History</p>
                </div>
                <div className="flex gap-4 text-[9px] font-black uppercase tracking-tighter">
                    <div className="flex flex-col items-end">
                        <span className="opacity-40">Max Win Streak</span>
                        <span className="text-emerald-500 text-sm">{stats.longestWin}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-40">Max Loss Streak</span>
                        <span className="text-rose-500 text-sm">{stats.longestLoss}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-24 gap-1.5 w-full">
                    {stats.recent.map((t, i) => (
                        <div 
                            key={t.id}
                            className={`w-full aspect-square rounded-md transition-all duration-500 group relative ${
                                t.result === 'Win' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                t.result === 'Loss' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.1)]' :
                                t.result === 'BE' ? 'bg-zinc-500 opacity-40' : 'bg-indigo-500 opacity-20'
                            } ${i === stats.recent.length - 1 ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent animate-pulse' : 'hover:scale-110 hover:brightness-110'}`}
                        >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                                {t.pair} | {t.result}
                            </div>
                        </div>
                    ))}
                    {Array.from({ length: Math.max(0, 48 - stats.recent.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className={`w-full aspect-square rounded-md border border-dashed ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`} />
                    ))}
                </div>

                {stats.isRecovery && (
                    <div className="mt-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-bounce">
                        <Award size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            Streak Recovery: +{currencySymbol}{stats.recoveredAmount.toLocaleString()} Recovered. Cycle Broken.
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Current Streak</span>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black transition-all duration-500 ${
                                    stats.currentStreakType === 'Win' ? 'text-emerald-500' : 
                                    stats.currentStreakType === 'Loss' ? 'text-rose-500' : 'text-zinc-500'
                                } ${stats.currentStreakValue >= 3 ? (stats.currentStreakType === 'Win' ? 'drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]') : ''}`}>
                                    {stats.currentStreakValue}
                                </span>
                                <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                                    {stats.currentStreakType === 'Win' ? 'Wins' : stats.currentStreakType === 'Loss' ? 'Losses' : stats.currentStreakType || 'Trades'}
                                </span>
                            </div>
                            
                            {stats.currentStreakType === 'Win' && stats.currentStreakValue >= 3 && (
                                <div className="animate-bounce text-orange-500">
                                    <Flame size={24} fill="currentColor" />
                                </div>
                            )}
                            {stats.currentStreakType === 'Loss' && stats.currentStreakValue >= 3 && (
                                <div className="animate-pulse text-blue-400">
                                    <Snowflake size={24} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                        <Activity size={24} className={stats.currentStreakType === 'Win' ? 'text-emerald-500' : stats.currentStreakType === 'Loss' ? 'text-rose-500' : 'opacity-20'} />
                    </div>
                </div>

                {/* Weekly Goal Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                        <span className="opacity-40">Weekly Volume Goal</span>
                        <span className={stats.tradesThisWeek >= stats.weeklyGoal ? 'text-emerald-500' : 'opacity-60'}>
                            {stats.tradesThisWeek} / {stats.weeklyGoal} Trades
                        </span>
                    </div>
                    <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <div 
                            className={`h-full transition-all duration-1000 ease-out rounded-full ${stats.tradesThisWeek >= stats.weeklyGoal ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-indigo-500'}`}
                            style={{ width: `${stats.weeklyProgress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const SymbolPerformanceWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const symbolStats = useMemo(() => {
        const safeTrades = trades || [];
        const stats: Record<string, { totalPnl: number; count: number }> = {};
        safeTrades.forEach(trade => {
            if (!trade.pair) return;
            const symbol = trade.pair.toUpperCase();
            if (!stats[symbol]) stats[symbol] = { totalPnl: 0, count: 0 };
            stats[symbol].totalPnl += trade.pnl || 0;
            stats[symbol].count += 1;
        });
        const symbolList = Object.entries(stats).map(([symbol, data]) => ({
            symbol,
            sum: data.totalPnl,
            avg: data.count > 0 ? data.totalPnl / data.count : 0
        }));
        const sortedBySum = [...symbolList].sort((a, b) => b.sum - a.sum);
        const sortedByAvg = [...symbolList].sort((a, b) => b.avg - a.avg);
        return {
            bestSymbolSum: sortedBySum[0] || null,
            worstSymbolSum: sortedBySum[sortedBySum.length - 1] || null,
            bestSymbolAvg: sortedByAvg[0] || null,
            worstSymbolAvg: sortedByAvg[sortedByAvg.length - 1] || null,
        };
    }, [trades]);

    const cards = [
        { label: 'Best Symbol Sum', data: symbolStats.bestSymbolSum },
        { label: 'Worst Symbol Sum', data: symbolStats.worstSymbolSum },
        { label: 'Best Symbol Avg', data: symbolStats.bestSymbolAvg },
        { label: 'Worst Symbol Avg', data: symbolStats.worstSymbolAvg },
    ];

    return (
        <div className={`p-6 rounded-[24px] border ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-lg font-bold tracking-tight mb-6">Symbol Performance</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-[#18181b] border-zinc-700/50' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">{card.label}</span>
                        </div>
                        <div className="text-xl font-black mb-1">{card.data?.symbol || '---'}</div>
                        <div className={`text-sm font-mono font-bold ${card.data && (card.label.includes('Sum') ? card.data.sum >= 0 : card.data.avg >= 0) ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {card.data ? (card.label.includes('Sum') ? `${currencySymbol}${card.data.sum.toFixed(2)}` : `${currencySymbol}${card.data.avg.toFixed(2)}`) : '---'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DrawdownOverTimeWidget = ({ trades = [], isDarkMode, userProfile }: { trades: Trade[], isDarkMode: boolean, userProfile: UserProfile }) => {
    const drawdownData = useMemo(() => {
        if (!trades || trades.length === 0) return [];
        const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let peak = userProfile?.initialBalance || 10000;
        let balance = peak;
        const data: { date: string; drawdown: number; balance: number }[] = [];
        sortedTrades.forEach(trade => {
            balance += trade.pnl;
            if (balance > peak) peak = balance;
            const drawdown = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
            data.push({ date: trade.date, drawdown, balance });
        });
        return data;
    }, [trades, userProfile?.initialBalance]);

    const maxDrawdown = drawdownData.length > 0 ? Math.max(...drawdownData.map(d => d.drawdown)) : 0;
    const maxY = Math.max(maxDrawdown * 1.2, 1);

    const generateAreaPath = (data: typeof drawdownData, width: number, height: number) => {
        if (!data || data.length < 2) return { line: "", area: "" };
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = (d.drawdown / maxY) * height;
            return { x, y };
        });
        const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
        return { line: linePath, area: areaPath };
    };

    const paths = generateAreaPath(drawdownData, 700, 200);

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[350px] ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-lg font-bold tracking-tight mb-6">Drawdown Over Time</h3>
            {drawdownData.length < 2 ? (
                <div className="flex-1 flex items-center justify-center opacity-30 text-sm">Insufficient data</div>
            ) : (
                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-[10px] font-mono opacity-40">
                        <span>0%</span>
                        <span>{(maxY / 2).toFixed(2)}%</span>
                        <span>{maxY.toFixed(2)}%</span>
                    </div>
                    <div className="ml-12 h-full pb-8">
                        <svg viewBox="0 0 700 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
                                </linearGradient>
                            </defs>
                            <path d={paths.area} fill="url(#drawdownGradient)" />
                            <path d={paths.line} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};


const TiltScoreWidget = ({ trades = [], isDarkMode }: { trades: Trade[], isDarkMode: boolean }) => {
    const scoreData = useMemo(() => {
        const safeTrades = trades || [];
        if (safeTrades.length === 0) return { score: 100, label: 'No Data', message: 'Start logging trades to see your tilt score.' };
        
        let totalScore = 0;
        let count = 0;

        safeTrades.forEach(t => {
            if (t.planAdherence === 'Followed Exactly') {
                totalScore += 100;
                count++;
            } else if (t.planAdherence === 'Minor Deviation') {
                totalScore += 50;
                count++;
            } else if (t.planAdherence === 'Major Deviation') {
                totalScore += 0;
                count++;
            } else if (t.planAdherence === 'No Plan') {
                totalScore += 20; // Penalize no plan heavily
                count++;
            }
        });

        const score = count > 0 ? Math.round(totalScore / count) : 100;
        
        let label = 'Poor';
        let message = 'Your discipline needs immediate attention.';
        if (score >= 90) { label = 'Elite'; message = 'Ice in your veins. Keep it up.'; }
        else if (score >= 75) { label = 'Good'; message = 'Solid discipline, watch out for small slips.'; }
        else if (score >= 60) { label = 'Average'; message = 'Inconsistent. Focus on following your plan.'; }
        
        return { score, label, message };
    }, [trades]);

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col items-center justify-center text-center min-h-[350px] ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-xl font-bold tracking-tight mb-6">Discipline Score</h3>
            <div className="relative w-48 h-48 mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke={isDarkMode ? "#1a1a1f" : "#f1f5f9"} strokeWidth="8" />
                    <circle 
                        cx="50" cy="50" r="45" 
                        fill="transparent" 
                        stroke={scoreData.score > 80 ? "#10b981" : scoreData.score > 50 ? "#f59e0b" : "#f43f5e"} 
                        strokeWidth="8" 
                        strokeDasharray={`${(scoreData.score / 100) * 283} 283`} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out" 
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-5xl font-black ${scoreData.score > 80 ? "text-emerald-500" : scoreData.score > 50 ? "text-amber-500" : "text-rose-500"}`}>
                            {scoreData.score}
                        </span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40 mt-1">{scoreData.label}</span>
                </div>
            </div>
            <p className="text-sm opacity-60 leading-relaxed max-w-[200px]">{scoreData.message}</p>
        </div>
    );
};

const PerformanceRadarWidget = ({ trades = [], isDarkMode }: { trades: Trade[], isDarkMode: boolean }) => {
    const [hoveredNode, setHoveredNode] = useState<{ mindset: string, value: number, x: number, y: number } | null>(null);

    const radarData = useMemo(() => {
        const safeTrades = trades || [];
        const mindsets = ['Confident', 'Neutral', 'Hesitant', 'Anxious', 'FOMO'];
        const stats: Record<string, { total: number, count: number }> = {};
        
        mindsets.forEach(m => stats[m] = { total: 0, count: 0 });
        
        safeTrades.forEach(trade => {
            const m = trade.mindset || 'Neutral';
            if (stats[m]) {
                stats[m].total += trade.pnl || 0;
                stats[m].count += 1;
            }
        });

        // Find max absolute value to normalize
        const values = mindsets.map(m => stats[m].count > 0 ? stats[m].total : 0);
        const maxAbs = Math.max(...values.map(Math.abs), 10); // Minimum scale of 10

        return mindsets.map((m, i) => {
            const angle = (i / mindsets.length) * 2 * Math.PI - Math.PI / 2;
            const rawValue = stats[m].count > 0 ? stats[m].total : 0;
            
            // Normalize: 0.5 is center (Break Even)
            let normalizedValue = 0.5;
            if (maxAbs > 0) {
                normalizedValue = 0.5 + (rawValue / (2 * maxAbs));
            }
            
            // Clamp
            normalizedValue = Math.max(0.1, Math.min(0.95, normalizedValue));

            return { 
                mindset: m, 
                x: Math.cos(angle), 
                y: Math.sin(angle), 
                value: normalizedValue,
                rawValue
            };
        });
    }, [trades]);

    const points = radarData.map(d => `${50 + d.x * d.value * 50},${50 + d.y * d.value * 50}`).join(' ');
    const zeroPoints = radarData.map(d => `${50 + d.x * 0.5 * 50},${50 + d.y * 0.5 * 50}`).join(' ');

    return (
        <div className={`p-8 rounded-[32px] border flex flex-col items-center min-h-[350px] relative ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-xl font-bold tracking-tight mb-12">Performance Radar</h3>
            <div className="relative w-64 h-64">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                    {/* Grid Rings - Solid & Subtle */}
                    {[0.25, 0.5, 0.75, 1].map((r, i) => (
                        <circle key={i} cx="50" cy="50" r={r * 50} fill="none" stroke={isDarkMode ? "white" : "black"} strokeOpacity="0.05" strokeWidth="0.5" />
                    ))}
                    
                    {/* Zero Line (Break Even) - Slightly distinct */}
                    <polygon points={zeroPoints} fill="none" stroke={isDarkMode ? "white" : "black"} strokeOpacity="0.1" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Axes - Dashed */}
                    {radarData.map((d, i) => (
                        <line key={i} x1="50" y1="50" x2={50 + d.x * 50} y2={50 + d.y * 50} stroke={isDarkMode ? "white" : "black"} strokeOpacity="0.05" strokeDasharray="2 2" />
                    ))}

                    {/* Data Shape - Cleaner Look */}
                    <polygon points={points} fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" />
                    
                    {/* Data Points - Technical Look */}
                    {radarData.map((d, i) => (
                        <circle 
                            key={i} 
                            cx={50 + d.x * d.value * 50} 
                            cy={50 + d.y * d.value * 50} 
                            r="2.5" 
                            fill={isDarkMode ? "#0d1117" : "white"} 
                            stroke="#6366f1" 
                            strokeWidth="1"
                            className="cursor-pointer hover:stroke-[2px] transition-all duration-200"
                            onMouseEnter={() => setHoveredNode({ mindset: d.mindset, value: d.rawValue, x: 50 + d.x * d.value * 50, y: 50 + d.y * d.value * 50 })}
                            onMouseLeave={() => setHoveredNode(null)}
                        />
                    ))}

                    {/* Labels */}
                    {radarData.map((d, i) => (
                        <text 
                            key={i} 
                            x={50 + d.x * 58} 
                            y={50 + d.y * 58} 
                            textAnchor="middle" 
                            dominantBaseline="middle" 
                            className="text-[5px] font-bold uppercase tracking-wider opacity-50 font-mono" 
                            fill={isDarkMode ? "white" : "black"}
                        >
                            {d.mindset}
                        </text>
                    ))}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredNode && (
                    <div 
                        className={`absolute z-50 px-3 py-2 rounded-lg text-xs font-bold pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 shadow-xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        style={{ 
                            left: `${(hoveredNode.x / 100) * 100}%`, 
                            top: `${(hoveredNode.y / 100) * 100}%` 
                        }}
                    >
                        <div className="opacity-60 text-[10px] uppercase tracking-wider mb-0.5">{hoveredNode.mindset}</div>
                        <div className={hoveredNode.value >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                            {hoveredNode.value >= 0 ? '+' : ''}{hoveredNode.value.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
            {/* Legend - Simplified */}
            <div className="mt-10 flex items-center gap-2 text-xs opacity-40 font-mono">
                 <div className="w-2 h-0.5 bg-indigo-500"></div>
                 <span>Performance Envelope</span>
            </div>
        </div>
    );
};

const PLByMindsetWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoveredMindset, setHoveredMindset] = useState<string | null>(null);

    const mindsetData = useMemo(() => {
        const safeTrades = trades || [];
        const mindsets = ['Confident', 'Neutral', 'Hesitant', 'Anxious', 'FOMO'];
        const stats: Record<string, { profit: number; loss: number }> = {};
        mindsets.forEach(m => stats[m] = { profit: 0, loss: 0 });

        safeTrades.forEach(trade => {
            const m = trade.mindset || 'Neutral';
            if (stats[m]) {
                if (trade.pnl > 0) stats[m].profit += trade.pnl;
                else stats[m].loss += Math.abs(trade.pnl || 0);
            }
        });

        return mindsets.map(m => ({
            mindset: m,
            profit: stats[m].profit,
            loss: stats[m].loss,
            net: stats[m].profit - stats[m].loss
        }));
    }, [trades]);

    const allValues = mindsetData.map(d => d.net);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;
    
    // Add padding to range
    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;
    
    const hoveredData = hoveredMindset ? mindsetData.find(d => d.mindset === hoveredMindset) : null;

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-xl font-bold tracking-tight mb-8">P/L by Mindset</h3>
            
            <div className="flex-1 flex relative overflow-hidden">
                {/* Y-Axis Labels */}
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative ml-2">
                    {/* Zero Line */}
                    <div 
                        className="absolute left-0 right-0 border-t border-white/20 z-10" 
                        style={{ top: `${zeroY}%` }} 
                    />
                    
                    {/* Bars Container */}
                    <div className="absolute inset-0 flex items-end justify-around pb-8">
                        {mindsetData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredMindset === d.mindset;
                            
                            return (
                                <div 
                                    key={i} 
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredMindset(d.mindset)} 
                                    onMouseLeave={() => setHoveredMindset(null)}
                                >
                                    <div className="relative w-full h-full z-10">
                                        <div 
                                            className={`absolute left-1/2 -translate-x-1/2 w-8 transition-all duration-500 rounded-sm ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${isHovered ? 'brightness-125 scale-x-110 shadow-lg' : 'opacity-80'}`} 
                                            style={{ 
                                                height: `${Math.max(2, netHeight)}%`, 
                                                bottom: isPositive ? `${100 - zeroY}%` : 'auto',
                                                top: isPositive ? 'auto' : `${zeroY}%`
                                            }} 
                                        />
                                    </div>
                                    <span className={`absolute bottom-[-24px] text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>
                                        {d.mindset}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tooltip */}
                {hoveredData && (
                    <div className={`absolute right-4 top-0 p-4 rounded-xl z-30 min-w-[140px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-xs mb-2 border-b border-white/10 pb-1">{hoveredData.mindset}</div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] opacity-60 uppercase font-bold">Net P/L</span>
                            <span className={`text-sm font-black ${hoveredData.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {hoveredData.net >= 0 ? '+' : ''}{currencySymbol}{hoveredData.net.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PLByPlanAdherenceWidget = ({ trades = [], isDarkMode, currencySymbol = '$' }: { trades: Trade[], isDarkMode: boolean, currencySymbol: string }) => {
    const [hoveredAdherence, setHoveredAdherence] = useState<string | null>(null);
    const adherenceData = useMemo(() => {
        const safeTrades = trades || [];
        const categories = ['Followed Exactly', 'Minor Deviation', 'Major Deviation', 'No Plan'];
        const stats: Record<string, { profit: number; loss: number }> = {};
        categories.forEach(c => stats[c] = { profit: 0, loss: 0 });
        
        safeTrades.forEach(trade => {
            const c = trade.planAdherence || 'No Plan';
            if (stats[c]) {
                if (trade.pnl > 0) stats[c].profit += trade.pnl;
                else stats[c].loss += Math.abs(trade.pnl || 0);
            } else {
                if (trade.pnl > 0) stats['No Plan'].profit += trade.pnl;
                else stats['No Plan'].loss += Math.abs(trade.pnl || 0);
            }
        });
        
        return categories.map(c => ({
            category: c === 'Followed Exactly' ? 'Followed' : c === 'Minor Deviation' ? 'Minor' : c === 'Major Deviation' ? 'Major' : 'None',
            fullLabel: c,
            profit: stats[c].profit,
            loss: stats[c].loss,
            net: stats[c].profit - stats[c].loss
        }));
    }, [trades]);

    const allValues = adherenceData.map(d => d.net);
    const maxVal = allValues.length ? Math.max(...allValues, 100) : 100;
    const minVal = allValues.length ? Math.min(...allValues, -100) : -100;
    
    // Add padding to range
    const range = (maxVal - minVal) * 1.2 || 1;
    const zeroY = (maxVal / range) * 100;
    
    const hoveredData = hoveredAdherence ? adherenceData.find(d => d.fullLabel === hoveredAdherence) : null;

    return (
        <div className={`p-6 rounded-[24px] border flex flex-col min-h-[400px] ${isDarkMode ? 'bg-[#0d1117] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
            <h3 className="text-xl font-bold tracking-tight mb-8">P/L by Plan Adherence</h3>
            
            <div className="flex-1 flex relative overflow-hidden">
                {/* Y-Axis Labels */}
                <div className="w-12 flex flex-col justify-between text-[10px] font-mono opacity-40 pb-8 border-r border-dashed border-white/5 pr-2 z-20">
                    <span>{currencySymbol}{Math.round(maxVal)}</span>
                    <span>{currencySymbol}0</span>
                    <span>{currencySymbol}{Math.round(minVal)}</span>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative ml-2">
                    {/* Zero Line */}
                    <div 
                        className="absolute left-0 right-0 border-t border-white/20 z-10" 
                        style={{ top: `${zeroY}%` }} 
                    />
                    
                    {/* Bars Container */}
                    <div className="absolute inset-0 flex items-end justify-around pb-8">
                        {adherenceData.map((d, i) => {
                            const netHeight = (Math.abs(d.net) / range) * 100;
                            const isPositive = d.net >= 0;
                            const isHovered = hoveredAdherence === d.fullLabel;
                            
                            return (
                                <div 
                                    key={i} 
                                    className="relative flex flex-col items-center flex-1 h-full group cursor-pointer"
                                    onMouseEnter={() => setHoveredAdherence(d.fullLabel)} 
                                    onMouseLeave={() => setHoveredAdherence(null)}
                                >
                                    <div className="relative w-full h-full z-10">
                                        <div 
                                            className={`absolute left-1/2 -translate-x-1/2 w-8 transition-all duration-500 rounded-sm ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'} ${isHovered ? 'brightness-125 scale-x-110 shadow-lg' : 'opacity-80'}`} 
                                            style={{ 
                                                height: `${Math.max(2, netHeight)}%`, 
                                                bottom: isPositive ? `${100 - zeroY}%` : 'auto',
                                                top: isPositive ? 'auto' : `${zeroY}%`
                                            }} 
                                        />
                                    </div>
                                    <span className={`absolute bottom-[-24px] text-[10px] font-bold whitespace-nowrap transition-all duration-300 ${isHovered ? 'opacity-100 text-indigo-500 scale-110' : 'opacity-40'}`}>
                                        {d.category}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tooltip */}
                {hoveredData && (
                    <div className={`absolute right-4 top-0 p-4 rounded-xl z-30 min-w-[140px] shadow-2xl border backdrop-blur-md animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-[#09090b]/90 border-zinc-700' : 'bg-white/90 border-slate-200'}`}>
                        <div className="font-bold text-xs mb-2 border-b border-white/10 pb-1">{hoveredData.fullLabel}</div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] opacity-60 uppercase font-bold">Net P/L</span>
                            <span className={`text-sm font-black ${hoveredData.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {hoveredData.net >= 0 ? '+' : ''}{currencySymbol}{hoveredData.net.toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ isDarkMode, trades = [], userProfile, eaSession }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'discipline' | 'comparison'>('overview');

    // Widget Order State
    const [overviewOrder, setOverviewOrder] = useLocalStorage('analytics_overview_order', [
        'winRate', 'profitFactor', 'grossProfit', 'grossLoss',
        'streakMomentum', 'equityCurve', 
        'drawdown', 'largestWinLoss', 
        'symbolPerformance', 'monthlyPerformance', 
        'currencyStrength', 'tradeExit'
    ]);
    
    const [growthOrder, setGrowthOrder] = useLocalStorage('analytics_growth_order', [
        'outcomeDist', 'perfByPair', 'executionTable'
    ]);

    const [disciplineOrder, setDisciplineOrder] = useLocalStorage('analytics_discipline_order', [
        'tiltScore', 'radar',
        'plMindset', 'plAdherence',
        'riskReward'
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Auto-inject missing widgets (Fixes stale localStorage for existing users)
    useEffect(() => {
        const defaultOverview = [
            'winRate', 'profitFactor', 'grossProfit', 'grossLoss',
            'streakMomentum', 'equityCurve', 'drawdown', 'largestWinLoss',
            'symbolPerformance', 'monthlyPerformance', 'currencyStrength', 'tradeExit'
        ];
        
        const missingWidgets = defaultOverview.filter(id => !overviewOrder.includes(id));
        if (missingWidgets.length > 0) {
            setOverviewOrder([...overviewOrder, ...missingWidgets]);
        }
    }, [overviewOrder, setOverviewOrder]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;

        if (activeTab === 'overview') {
            setOverviewOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (activeTab === 'growth') {
             setGrowthOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (activeTab === 'discipline') {
             setDisciplineOrder((items) => {
                const oldIndex = items.indexOf(String(active.id));
                const newIndex = items.indexOf(String(over.id));
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const stats = useMemo(() => {
        const safeTrades = trades || [];
        const wins = safeTrades.filter(t => t.result === 'Win');
        const losses = safeTrades.filter(t => t.result === 'Loss');
        const totalCount = safeTrades.length || 1;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        const netProfit = grossProfit - grossLoss;
        const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : (grossProfit > 0 ? 9.9 : 0);
        const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
        const riskRewardRatio = avgLoss > 0 ? (avgWin / avgLoss) : 0;
        const winRate = (wins.length / totalCount) * 100;
        return {
            netProfit, grossProfit, grossLoss,
            winRate: winRate.toFixed(1),
            profitFactor: profitFactor.toFixed(2),
            avgWin, avgLoss,
            rrRatio: riskRewardRatio.toFixed(2),
            totalTrades: safeTrades.length
        };
    }, [trades]);

    const equityData = useMemo(() => {
        const safeTrades = trades || [];
        let cumulative = userProfile?.initialBalance || 0;
        const data = [cumulative];
        const sortedTrades = [...safeTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sortedTrades.forEach(t => {
            cumulative += t.pnl;
            data.push(cumulative);
        });
        return data;
    }, [trades, userProfile?.initialBalance]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'growth', label: 'Growth', icon: LineChart },
        { id: 'discipline', label: 'Discipline', icon: Target },
        { id: 'comparison', label: 'Comparison', icon: ArrowRightLeft }
    ] as const;

    const renderWidget = (id: string) => {
        const currencySymbol = userProfile?.currencySymbol || '$';
        switch(id) {
            // Overview Widgets
            case 'winRate':
                 return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Win Rate</span>
                        <div className="text-2xl font-black">{stats.winRate}%</div>
                    </div>
                 );
            case 'profitFactor':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profit Factor</span>
                        <div className="text-2xl font-black">{stats.profitFactor}</div>
                    </div>
                );
            case 'grossProfit':
                return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Profit</span>
                        <div className="text-2xl font-black text-emerald-500">+{currencySymbol}{stats.grossProfit.toLocaleString()}</div>
                    </div>
                );
            case 'grossLoss':
                 return (
                    <div className={`h-full p-6 rounded-[24px] border flex flex-col justify-between ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-200 shadow-md'}`}>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Gross Loss</span>
                        <div className="text-2xl font-black text-rose-500">-{currencySymbol}{stats.grossLoss.toLocaleString()}</div>
                    </div>
                 );
            case 'streakMomentum':
                return <MomentumStreakWidget trades={trades} isDarkMode={isDarkMode} />;
            case 'equityCurve': {
                // If EA Session exists, use bridge equity as current balance
                const currentBalance = eaSession?.data?.account?.equity !== undefined 
                    ? eaSession.data.account.equity 
                    : (equityData?.length > 0 ? equityData[equityData.length - 1] : 0);
                
                return (
                    <EquityCurveWidget 
                        trades={trades} 
                        equityData={equityData} 
                        isDarkMode={isDarkMode} 
                        currencySymbol={currencySymbol} 
                        currentBalanceOverride={currentBalance}
                    />
                );
            }
            case 'drawdown':
                return <DrawdownOverTimeWidget trades={trades} isDarkMode={isDarkMode} userProfile={userProfile} />;
            case 'largestWinLoss':
                return <LargestWinLossWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'symbolPerformance':
                return <SymbolPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'monthlyPerformance':
                return <MonthlyPerformanceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'currencyStrength':
                return <CurrencyStrengthMeter isDarkMode={isDarkMode} trades={trades} />;
            case 'tradeExit':
                return <TradeExitAnalysisWidget trades={trades} isDarkMode={isDarkMode} />;
            
            // Growth Widgets
            case 'outcomeDist': {
                const safeTrades = trades || [];
                const total = safeTrades.length || 1;
                const winCount = safeTrades.filter(t => t.result === 'Win').length;
                const lossCount = safeTrades.filter(t => t.result === 'Loss').length;
                const beCount = safeTrades.filter(t => t.result === 'BE').length;

                const winRate = (winCount / total) * 100;
                const lossRate = (lossCount / total) * 100;
                const beRate = (beCount / total) * 100;

                return (
                    <div className={`h-full p-8 rounded-[32px] border flex flex-col items-center justify-between ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-2 self-start mb-4">
                            <PieChart size={20} className="text-teal-500" />
                            <h3 className="font-bold text-lg uppercase tracking-wide opacity-80">Outcome Distribution</h3>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            <div className="relative w-56 h-56 group transition-transform duration-500 hover:scale-105">
                                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                    {/* Background Circle */}
                                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke={isDarkMode ? "#27272a" : "#f1f5f9"} strokeWidth="3.5" />
                                    
                                    {/* Win Segment */}
                                    <circle 
                                        cx="18" cy="18" r="15.915" 
                                        fill="transparent" 
                                        stroke="#10b981" 
                                        strokeWidth="3.5" 
                                        strokeDasharray={`${winRate} 100`} 
                                        strokeDashoffset="0"
                                        className="transition-all duration-1000 ease-out" 
                                    />
                                    
                                    {/* Loss Segment */}
                                    <circle 
                                        cx="18" cy="18" r="15.915" 
                                        fill="transparent" 
                                        stroke="#f43f5e" 
                                        strokeWidth="3.5" 
                                        strokeDasharray={`${lossRate} 100`} 
                                        strokeDashoffset={`-${winRate}`}
                                        className="transition-all duration-1000 ease-out" 
                                    />

                                    {/* BE Segment */}
                                    <circle 
                                        cx="18" cy="18" r="15.915" 
                                        fill="transparent" 
                                        stroke="#71717a" 
                                        strokeWidth="3.5" 
                                        strokeDasharray={`${beRate} 100`} 
                                        strokeDashoffset={`-${winRate + lossRate}`}
                                        className="transition-all duration-1000 ease-out" 
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{winRate.toFixed(0)}%</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Win Rate</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 mt-8 w-full border-t border-white/5 pt-6">
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Wins</span>
                                </div>
                                <span className="text-sm font-black">{winCount}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Losses</span>
                                </div>
                                <span className="text-sm font-black">{lossCount}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.5)]" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">BE</span>
                                </div>
                                <span className="text-sm font-black">{beCount}</span>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'perfByPair':
                return <PerformanceByPairWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'executionTable':
                return (
                     <div className="space-y-4">
                        <h3 className="text-xl font-bold tracking-tight px-4">Trade Execution Analysis</h3>
                        <ExecutionPerformanceTable trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} initialBalance={userProfile?.initialBalance || 0} />
                    </div>
                );

            // Discipline Widgets
            case 'tiltScore':
                return <TiltScoreWidget trades={trades} isDarkMode={isDarkMode} />;
            case 'radar':
                return <PerformanceRadarWidget trades={trades} isDarkMode={isDarkMode} />;
            case 'plMindset':
                return <PLByMindsetWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'plAdherence':
                return <PLByPlanAdherenceWidget trades={trades} isDarkMode={isDarkMode} currencySymbol={currencySymbol} />;
            case 'riskReward':
                return (
                    <div className={`h-full p-8 rounded-[32px] border ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-slate-200 shadow-md'}`}>
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" />
                            Risk/Reward Efficiency
                        </h3>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-60">Avg Win</span>
                                <span className="text-xl font-black text-emerald-500">{currencySymbol}{Math.round(stats.avgWin).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-sm opacity-60">Avg Loss</span>
                                <span className="text-xl font-black text-rose-500">{currencySymbol}{Math.round(stats.avgLoss).toLocaleString()}</span>
                            </div>
                            <div className="pt-6 border-t border-dashed border-white/10 flex justify-between items-end">
                                <span className="text-sm font-bold">Expectancy (R:R)</span>
                                <span className="text-2xl font-black text-indigo-500">
                                    1 : {stats.avgLoss === 0 ? '∞' : stats.rrRatio}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const getColSpan = (id: string) => {
        // Based on 12-column grid
        switch(id) {
            case 'winRate': case 'profitFactor': case 'grossProfit': case 'grossLoss': return 'col-span-12 md:col-span-6 lg:col-span-3';
            case 'streakMomentum': return 'col-span-12';
            case 'equityCurve': return 'col-span-12 lg:col-span-6';
            case 'drawdown': return 'col-span-12 lg:col-span-6';
            case 'largestWinLoss': return 'col-span-12 lg:col-span-6';
            case 'symbolPerformance': return 'col-span-12 lg:col-span-6';
            case 'monthlyPerformance': case 'currencyStrength': case 'tradeExit': return 'col-span-12 lg:col-span-4';
            
            case 'outcomeDist': return 'col-span-12 lg:col-span-4';
            case 'perfByPair': return 'col-span-12 lg:col-span-8';
            case 'executionTable': return 'col-span-12';
            
            case 'tiltScore': case 'radar': case 'plMindset': case 'plAdherence': return 'col-span-12 lg:col-span-6';
            case 'riskReward': return 'col-span-12';
            default: return 'col-span-12';
        }
    }

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
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-5 py-2.5 rounded-[16px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-indigo-500'}`}>
                                <tab.icon size={16} strokeWidth={isActive ? 3 : 2} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </header>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                {activeTab === 'overview' && (
                    <SortableContext items={overviewOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {overviewOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'growth' && (
                    <SortableContext items={growthOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {growthOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'discipline' && (
                    <SortableContext items={disciplineOrder} strategy={rectSortingStrategy}>
                        <div className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 pb-20">
                            {disciplineOrder.map(id => (
                                <SortableWidget key={id} id={id} className={getColSpan(id)}>
                                    {renderWidget(id)}
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>
                )}

                {activeTab === 'comparison' && (
                    <ComparisonView trades={trades} isDarkMode={isDarkMode} currencySymbol={userProfile?.currencySymbol || '$'} />
                )}
            </DndContext>
        </div>
    );
};

export default Analytics;