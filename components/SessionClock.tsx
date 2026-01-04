
import React, { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';

interface SessionClockProps {
  isDarkMode: boolean;
}

const SESSIONS = [
  { name: 'Sydney', start: 22, end: 7, color: 'text-amber-500', bg: 'bg-amber-500' },
  { name: 'Tokyo', start: 0, end: 9, color: 'text-rose-500', bg: 'bg-rose-500' },
  { name: 'London', start: 8, end: 17, color: 'text-blue-500', bg: 'bg-blue-500' },
  { name: 'New York', start: 13, end: 22, color: 'text-emerald-500', bg: 'bg-emerald-500' },
];

const SessionClock: React.FC<SessionClockProps> = ({ isDarkMode }) => {
  const [utcTime, setUtcTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSessionStatus = (start: number, end: number) => {
    const currentHour = utcTime.getUTCHours();
    const currentMin = utcTime.getUTCMinutes();
    const currentTime = currentHour + currentMin / 60;

    let isOpen = false;
    let progress = 0;
    
    // Normalize times for calculation
    const s = start;
    const e = end;
    const c = currentTime;
    
    if (s > e) {
      // Wraps around midnight (e.g. 22:00 to 07:00)
      if (c >= s) {
        // Before midnight part
        isOpen = true;
        // Total duration is (24-s) + e
        progress = ((c - s) / (24 - s + e)) * 100;
      } else if (c < e) {
        // After midnight part
        isOpen = true;
        progress = ((24 - s + c) / (24 - s + e)) * 100;
      } else {
         // Closed
         let timeToOpen = (s - c);
         return { state: 'Closed', label: `Opens in ${Math.floor(timeToOpen)}h`, progress: 0 };
      }
    } else {
      // Standard session (e.g. 08:00 to 17:00)
      if (c >= s && c < e) {
        isOpen = true;
        progress = ((c - s) / (e - s)) * 100;
      } else {
        let timeToOpen = c < s ? s - c : (24 - c + s);
        return { state: 'Closed', label: `Opens in ${Math.floor(timeToOpen)}h`, progress: 0 };
      }
    }

    if (isOpen) {
        return { state: 'Open', label: 'Market Open', progress };
    }
    return { state: 'Closed', label: 'Closed', progress: 0 };
  };

  return (
    <div className={`w-full p-6 rounded-2xl border mb-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-md'}`}>
      
      {/* Main UTC Clock */}
      <div className="flex items-center gap-4 min-w-[200px]">
         <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'}`}>
            <Globe size={24} className="animate-[spin_60s_linear_infinite]" />
         </div>
         <div>
             <h3 className="text-2xl font-mono font-bold tracking-tight">
                {utcTime.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false })}
             </h3>
             <p className="text-xs font-bold uppercase tracking-widest opacity-50">UTC Time</p>
         </div>
      </div>

      <div className={`h-px xl:h-12 w-full xl:w-px ${isDarkMode ? 'bg-zinc-800' : 'bg-slate-200'}`} />

      {/* Session Bars */}
      <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
          {SESSIONS.map(session => {
              const status = getSessionStatus(session.start, session.end);
              const isOpen = status.state === 'Open';

              return (
                  <div key={session.name} className={`relative p-3 rounded-xl border overflow-hidden ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                      {/* Progress Background */}
                      {isOpen && (
                          <div 
                            className={`absolute bottom-0 left-0 h-1 ${session.bg} transition-all duration-1000`} 
                            style={{ width: `${status.progress}%` }} 
                          />
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">{session.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOpen ? `${session.bg} text-white` : 'bg-zinc-500/10 text-zinc-500'}`}>
                              {status.state.toUpperCase()}
                          </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                          <Clock size={12} className={isOpen ? session.color : 'text-zinc-500'} />
                          <span className={`text-xs font-medium ${isOpen ? 'text-white' : 'opacity-50'}`}>
                              {isOpen ? 'Active Now' : status.label}
                          </span>
                      </div>
                  </div>
              );
          })}
      </div>
    </div>
  );
};

export default SessionClock;
