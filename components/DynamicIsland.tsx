
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Users, ChevronDown, Activity, UserPlus, Link, Settings2 } from 'lucide-react';
import { ConnectionState, AudioPeer } from '../types';

interface DynamicIslandProps {
  connectionState: ConnectionState;
  peers: AudioPeer[];
  userVolume: number; // 0 to 1
  aiVolume: number;   // 0 to 1
  aiTranscription?: string;
  isDarkMode: boolean; // Received from parent
  onToggleMute: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
  onAddUser: () => void;
  onConfigureAI?: () => void;
}

const getStateConfig = (state: ConnectionState) => {
  switch (state) {
    case ConnectionState.CONNECTED:
      return { color: 'bg-emerald-500', text: 'Live' };
    case ConnectionState.CONNECTING:
      return { color: 'bg-amber-500', text: 'Connecting' };
    case ConnectionState.ERROR:
      return { color: 'bg-rose-500', text: 'Error' };
    case ConnectionState.DISCONNECTED:
    default:
      return { color: 'bg-zinc-500', text: 'Start Session' };
  }
};

// Simple waveform component
const Waveform = ({ volume, color }: { volume: number, color: string }) => {
    // Generate 5 bars
    const bars = [0.4, 0.7, 1.0, 0.7, 0.4]; 
    return (
        <div className="flex items-center gap-[2px] h-4">
            {bars.map((scale, i) => {
                // Determine height based on volume
                const height = Math.max(3, volume * 18 * scale);
                return (
                    <div 
                        key={i} 
                        className={`w-1 rounded-full ${color} transition-all duration-75`} 
                        style={{ height: `${height}px` }}
                    ></div>
                );
            })}
        </div>
    );
};

const DynamicIsland: React.FC<DynamicIslandProps> = ({
  connectionState,
  peers,
  userVolume,
  aiVolume,
  aiTranscription,
  isDarkMode,
  onToggleMute,
  onDisconnect,
  onConnect,
  onAddUser,
  onConfigureAI
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  
  const stateConfig = getStateConfig(connectionState);

  // Auto-collapse after delay if mouse leaves
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDisconnect = () => {
    onDisconnect();
    setIsExpanded(false);
  };

  const getContainerClasses = () => {
    // Professional Obsidian/Glass Look
    const baseClasses = isDarkMode 
        ? "bg-black/80 backdrop-blur-xl border border-white/10 text-white shadow-2xl overflow-hidden" 
        : "bg-white/90 backdrop-blur-xl text-zinc-900 shadow-xl border border-zinc-200 overflow-hidden";
    
    if (isExpanded) {
      return `${baseClasses} w-[400px] rounded-[28px] p-6 transition-all duration-300 ease-spring`;
    }
    return `${baseClasses} w-[220px] h-[48px] rounded-full flex items-center justify-between px-2 transition-all duration-300 ease-spring`;
  };

  const aiPeer = peers.find(p => p.type === 'ai');

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex justify-center perspective-1000">
      <div
        ref={containerRef}
        className={getContainerClasses()}
        style={{ height: isExpanded ? 'auto' : '48px' }}
      >
        {!isExpanded ? (
          // COLLAPSED STATE
          <div 
            className="flex items-center justify-between w-full h-full cursor-pointer"
            onClick={() => setIsExpanded(true)}
          >
            <div className="flex-1 flex items-center gap-3 pl-2 overflow-hidden">
              <div className="relative shrink-0 w-8 flex justify-center">
                 {isConnected ? (
                   aiPeer?.isSpeaking 
                    ? <Waveform volume={aiVolume} color="bg-indigo-500" />
                    : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                        <MicOff size={12} className="text-zinc-400" />
                    </div>
                 )}
              </div>
              
              <div className="flex items-center gap-2">
                 {/* Status Dot */}
                 {!isConnected && <div className={`w-1.5 h-1.5 rounded-full ${stateConfig.color} ${isConnecting ? 'animate-pulse' : ''}`} />}
                 <span className={`text-xs font-semibold tracking-wide truncate ${isDarkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {stateConfig.text}
                 </span>
              </div>
            </div>
            
            <div className="pr-1 shrink-0">
               {isConnected ? (
                   <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                       <Activity size={14} className="text-emerald-500 animate-pulse" />
                   </div>
               ) : (
                   <div className="px-3 py-1 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-600/20">
                       START
                   </div>
               )}
            </div>
          </div>
        ) : (
          // EXPANDED STATE
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" onClick={() => setIsExpanded(false)}>
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Activity className="text-white" size={20} />
                 </div>
                 <div>
                    <h3 className="font-bold text-sm leading-tight">Live Session</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${stateConfig.color} ${isConnecting ? 'animate-pulse' : ''}`} />
                        <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">{stateConfig.text} • {peers.length} Peers</p>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100'}`}
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Avatar Grid */}
            <div className="flex justify-center gap-6 py-2 flex-wrap">
               {peers.map((peer) => {
                  const isTalking = peer.type === 'human' ? userVolume > 0.1 : aiVolume > 0.1;
                  const ringColor = isTalking ? 'ring-emerald-500 ring-offset-zinc-950' : 'ring-transparent';
                  
                  return (
                    <div 
                        key={peer.id} 
                        className={`flex flex-col items-center gap-2 relative group ${peer.type === 'ai' && !isConnected ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                            if (peer.type === 'ai' && !isConnected && onConfigureAI) {
                                onConfigureAI();
                            }
                        }}
                    >
                        <div className={`relative w-16 h-16 rounded-full ring-2 ring-offset-2 transition-all duration-200 ${ringColor}`}>
                            <img 
                                src={peer.avatar} 
                                alt={peer.name} 
                                className={`w-full h-full rounded-full object-cover grayscale-[0.2] ${isDarkMode ? 'bg-zinc-800' : 'bg-zinc-200'} ${peer.type === 'ai' && !isConnected ? 'group-hover:opacity-80' : ''}`}
                            />
                            {peer.isMuted && (
                                <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border border-zinc-700 shadow-sm ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
                                    <MicOff size={12} className="text-rose-400" />
                                </div>
                            )}
                            
                            {/* Visual Waveform for Speaker */}
                            {peer.type === 'ai' && isTalking && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5 h-3 items-end">
                                    <div className="w-1 bg-indigo-500 rounded-full animate-[bounce_0.5s_infinite]" style={{ height: '8px' }}></div>
                                    <div className="w-1 bg-indigo-500 rounded-full animate-[bounce_0.6s_infinite]" style={{ height: '12px' }}></div>
                                    <div className="w-1 bg-indigo-500 rounded-full animate-[bounce_0.5s_infinite]" style={{ height: '8px' }}></div>
                                </div>
                            )}
                            
                            {peer.type === 'ai' && !isConnected && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Settings2 size={20} className="text-white" />
                                </div>
                            )}
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>{peer.name}</span>
                    </div>
                  )
               })}
               
               <button onClick={onAddUser} className="flex flex-col items-center gap-2 group">
                   <div className={`w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${isDarkMode ? 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900' : 'border-zinc-300 hover:border-zinc-400'}`}>
                       <UserPlus size={20} className="text-zinc-500 group-hover:text-zinc-300" />
                   </div>
                   <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Invite</span>
               </button>
            </div>

            {/* Live Transcript Bubble */}
            {isConnected && aiTranscription && (
              <div className={`${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} backdrop-blur rounded-xl p-4 border shadow-inner`}>
                <p className={`text-sm leading-relaxed text-center font-medium ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  "{aiTranscription}"
                </p>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mt-2">
              {!isConnected ? (
                  <button 
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    {isConnecting ? 'Establishing Connection...' : 'Start Live Session'}
                  </button>
              ) : (
                <>
                  <button 
                    onClick={onToggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border ${
                        peers.find(p => p.type === 'human')?.isMuted 
                        ? (isDarkMode ? 'bg-white text-black border-white' : 'bg-zinc-900 text-white border-zinc-900')
                        : (isDarkMode ? 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-50 border-zinc-200')
                    }`}
                  >
                    {peers.find(p => p.type === 'human')?.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  
                  <button 
                    onClick={handleDisconnect}
                    className="w-14 h-14 rounded-full bg-rose-500 text-white hover:bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    <PhoneOff size={24} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicIsland;
