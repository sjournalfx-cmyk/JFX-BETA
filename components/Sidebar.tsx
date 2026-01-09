
import React from 'react';
import {
  LayoutDashboard, PlusCircle, History, BarChart2,
  Target, StickyNote, Calculator,
  Workflow, ChevronRight, CandlestickChart, LogOut,
  Settings, Sun, Moon, Link, Activity, Lock
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCalculator: () => void;
  onLogout: () => void;
  userProfile?: UserProfile | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  isDarkMode,
  onToggleTheme,
  onOpenCalculator,
  onLogout,
  userProfile
}) => {
  const isFreePlan = userProfile?.plan === 'FREE TIER (JOURNALER)';

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'log-trade', icon: PlusCircle, label: 'Log Trade' },
    { id: 'history', icon: History, label: 'Journal' },
    { id: 'analytics', icon: BarChart2, label: 'Analytics' },
    { id: 'notes', icon: StickyNote, label: 'Notebook' },
    { id: 'ea-setup', icon: Link, label: 'Desktop Bridge', restricted: true },

    { id: 'charts', icon: CandlestickChart, label: 'Market Grid', restricted: true },
    { id: 'diagrams', icon: Workflow, label: 'Strategy Maps', restricted: true },
    { id: 'goals', icon: Target, label: 'Goals', restricted: true },
    { id: 'calculators', icon: Calculator, label: 'Calculators', restricted: true },
  ];

  // Show all items, but track which ones are restricted for the current user
  const visibleMenuItems = menuItems;

  return (
    <div className={`h-full w-[72px] flex flex-col items-center py-6 border-r z-[100] transition-all duration-300 relative ${isDarkMode
      ? 'bg-[#050505] border-zinc-800 shadow-[4px_0_24px_rgba(0,0,0,0.5)]'
      : 'bg-white border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'
      }`}>
      <style>{`
        @keyframes heartbeat {
            0% { transform: scale(1); opacity: 0.6; }
            15% { transform: scale(1.1); opacity: 1; }
            30% { transform: scale(1); opacity: 0.6; }
            45% { transform: scale(1.15); opacity: 1; }
            60% { transform: scale(1); opacity: 0.6; }
            100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes pulse-line {
            0% { stroke-dashoffset: 100; opacity: 0.4; }
            20% { stroke-dashoffset: 0; opacity: 1; }
            40% { stroke-dashoffset: -100; opacity: 0.4; }
            100% { stroke-dashoffset: -100; opacity: 0.4; }
        }
      `}</style>


      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-3 w-full px-3 overflow-y-visible">

        {/* Live Pulse Animation */}
        <div className="flex items-center justify-center w-full mb-2">
          <div className={`w-10 h-10 rounded-full border flex items-center justify-center relative transition-colors duration-500 ${userProfile?.eaConnected ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
            {userProfile?.eaConnected ? (
              <div className="relative flex items-center justify-center" style={{ animation: 'heartbeat 2s infinite ease-in-out' }}>
                <svg width="24" height="16" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M0 20H15L18 28L24 8L30 35L34 20H60"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: '100',
                      animation: 'pulse-line 2s infinite linear',
                      filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))'
                    }}
                  />
                </svg>
              </div>
            ) : (
              <Activity size={20} className="text-rose-500" />
            )}
            
            {userProfile?.eaConnected ? (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/60 animate-ping" />
            ) : (
              <div className="absolute inset-0 rounded-full border-4 border-rose-500/60" />
            )}
          </div>
        </div>

        {visibleMenuItems.map((item) => {
          const isActive = currentView === item.id;
          const isLocked = isFreePlan && item.restricted;
          
          return (
            <div key={item.id} className="relative group flex items-center justify-center">
              <button
                onClick={() => !isLocked && onViewChange(item.id)}
                className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 relative z-10
                  ${isActive
                    ? 'bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/30 scale-105'
                    : isLocked 
                      ? 'text-zinc-500/40 cursor-not-allowed' 
                      : `text-zinc-500 hover:bg-zinc-100 ${isDarkMode ? 'hover:bg-zinc-900 hover:text-zinc-200' : 'hover:text-zinc-800'}`
                  }
                `}
              >
                <div className="relative">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {isLocked && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#FF4F01] rounded-full p-0.5 shadow-sm">
                      <Lock size={8} fill="white" className="text-white" />
                    </div>
                  )}
                </div>

                {/* Alert Dot for unfinished Bridge setup */}
                {item.id === 'ea-setup' && !isLocked && userProfile?.syncMethod === 'EA_CONNECT' && !userProfile?.eaConnected && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-[#050505] animate-bounce" />
                )}

                {/* Active Indicator Glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-[#FF4F01] blur-[8px] opacity-20 -z-10 animate-pulse" />
                )}
              </button>

              {/* Tooltip */}
              <div className={`
                absolute left-[64px] px-3 py-2 rounded-xl backdrop-blur-xl border pointer-events-none 
                opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-[200]
                shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center gap-2
                ${isDarkMode
                  ? 'bg-zinc-900/95 border-white/10 text-white'
                  : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-200'
                }
              `}>
                <span className="text-xs font-bold tracking-tight">
                  {item.label}
                  {isLocked && " (Locked)"}
                </span>
                {isActive && <ChevronRight size={12} className="opacity-40" />}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="flex flex-col gap-3 w-full px-3 mt-4 shrink-0 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800/50">
        
        {/* Theme Toggle Action */}
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onToggleTheme}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-500 hover:bg-amber-500/10 hover:text-amber-500 ${isDarkMode ? 'hover:bg-indigo-500/20 hover:text-indigo-400' : ''}`}
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className={`absolute left-[64px] px-3 py-2 rounded-xl backdrop-blur-xl border pointer-events-none opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-[200] shadow-xl ${isDarkMode ? 'bg-zinc-900/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
            <span className="text-xs font-bold tracking-tight">{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</span>
          </div>
        </div>

        {/* Settings / Profile Action */}
        <div className="relative group flex items-center justify-center">
          <button
            onClick={() => onViewChange('settings')}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-500 hover:bg-indigo-500/10 hover:text-indigo-500 ${isDarkMode ? 'hover:bg-indigo-500/20' : ''} ${currentView === 'settings' ? 'bg-[#FF4F01] text-white shadow-lg' : ''} overflow-hidden`}
          >
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Settings size={18} />
            )}
          </button>
          <div className={`absolute left-[64px] px-3 py-2 rounded-xl backdrop-blur-xl border pointer-events-none opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-[200] shadow-xl ${isDarkMode ? 'bg-zinc-900/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
            <span className="text-xs font-bold tracking-tight">System Settings</span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onLogout}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 ${isDarkMode ? 'hover:bg-rose-500/20' : ''}`}
          >
            <LogOut size={18} />
          </button>
          <div className={`absolute left-[64px] px-3 py-2 rounded-xl backdrop-blur-xl border pointer-events-none opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-[200] shadow-xl ${isDarkMode ? 'bg-zinc-900/95 border-white/10 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
            <span className="text-xs font-bold tracking-tight">Logout Account</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
