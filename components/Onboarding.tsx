
import React, { useState, useRef, useEffect } from 'react';
import { User, Globe, DollarSign, Zap, ChevronRight, CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, Terminal, Shield, Flame, Check, Wallet, Cpu } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingProps {
  isDarkMode: boolean;
  onComplete: (profile: UserProfile) => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
];

const Onboarding: React.FC<OnboardingProps> = ({ isDarkMode, onComplete }) => {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    country: '',
    accountName: 'Primary Trading Account',
    initialBalance: 10000,
    currency: 'USD',
    currencySymbol: '$',
    syncMethod: 'Manual',
    experienceLevel: 'Beginner',
    tradingStyle: 'Day Trader',
    onboarded: true,
    plan: 'Free Plan'
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setIsAtBottom(true);
      }
    }
  };

  const isFreePlan = selectedPlan === 'Free Plan';

  const nextStep = () => {
    if (step === 4 && isFreePlan) {
      // Skip Sync Tech, go to Account Config
      setFormData(prev => ({ ...prev, syncMethod: 'Manual', plan: 'Free Plan' }));
      setStep(6);
    } else {
      setStep(s => Math.min(s + 1, 6));
    }
  };

  const prevStep = () => {
    if (step === 6 && isFreePlan) {
      setStep(4);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    setFormData(prev => ({ ...prev, plan: planName }));
    if (planName === 'Free Plan') {
        setFormData(prev => ({ ...prev, syncMethod: 'Manual', plan: 'Free Plan' }));
        setStep(6); // Jump to Account Config
    } else {
        setStep(5); // Go to Sync Tech
    }
  };

  const handleSelectSync = (method: 'Manual' | 'EA_CONNECT') => {
    setFormData(prev => ({ ...prev, syncMethod: method }));
    if (method === 'Manual') {
      setStep(6); // Show Account Config
    } else {
      // If EA_CONNECT chosen, proceed to finish
      handleFinishDirect(method);
    }
  };

  const handleFinishDirect = (method: 'Manual' | 'EA_CONNECT') => {
    if (formData.name && formData.country) {
      const finalData = {
        ...formData,
        syncMethod: method,
        accountName: formData.accountName || 'EA Sync Account'
      };
      onComplete(finalData as UserProfile);
    }
  };

  const handleFinish = () => {
    if (formData.name && formData.country && formData.accountName) {
      onComplete(formData as UserProfile);
    }
  };

  const containerBg = isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#fcfcfc]';
  const textColor = isDarkMode ? 'text-white' : 'text-[#1a1a1a]';
  const subTextColor = isDarkMode ? 'text-zinc-500' : 'text-[#666666]';

  // Total steps for UI display
  const totalStepsUI = 6;

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto ${containerBg} ${textColor} font-sans`}>
      <div className="w-full max-w-6xl px-6 py-12 lg:py-20 flex flex-col min-h-full">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex gap-1.5 items-center">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div 
                key={s} 
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-8 bg-[#FF4F01]' : s < step ? 'w-2.5 bg-[#FF4F01]/40' : 'w-2.5 bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
             {step === 6 && (
                 <div className="flex gap-2">
                     <span className="border border-[#FF4F01] text-[10px] font-bold px-2 py-1 rounded text-[#FF4F01] uppercase tracking-widest animate-pulse">Final Step</span>
                 </div>
             )}
             <div className="bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-md text-[11px] font-bold text-zinc-500 uppercase tracking-widest border border-zinc-200 dark:border-zinc-800">
               Step {step} of {totalStepsUI}
             </div>
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Welcome to JournalFX</h1>
               <p className={`text-lg mb-12 ${subTextColor}`}>Let's start with your identity and country to tailor the regional experience.</p>
               
               <div className="space-y-8">
                  <div className="group">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Full Name</label>
                    <input 
                      autoFocus
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Satoshi Nakamoto"
                      className={`w-full bg-transparent border-b-2 py-4 text-2xl font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 focus:border-[#FF4F01]' : 'border-zinc-200 focus:border-[#FF4F01]'}`}
                    />
                  </div>
                  <div className="group">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Country</label>
                    <input 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      placeholder="e.g. United Kingdom"
                      className={`w-full bg-transparent border-b-2 py-4 text-2xl font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 focus:border-[#FF4F01]' : 'border-zinc-200 focus:border-[#FF4F01]'}`}
                    />
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Trading Persona</h1>
               <p className={`text-lg mb-12 ${subTextColor}`}>Help us understand your trading background and style.</p>
               
               <div className="space-y-12">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-60">Experience Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Beginner', 'Intermediate', 'Advanced', 'Pro'].map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => setFormData({...formData, experienceLevel: lvl as any})}
                                className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                                    formData.experienceLevel === lvl 
                                    ? 'border-[#FF4F01] bg-[#FF4F01]/5' 
                                    : isDarkMode ? 'border-zinc-800 bg-[#111]' : 'border-zinc-100 bg-white shadow-sm'
                                }`}
                            >
                                <div className="font-bold text-sm mb-1">{lvl}</div>
                                {formData.experienceLevel === lvl && <div className="absolute top-3 right-3 text-[#FF4F01]"><Check size={14} /></div>}
                            </button>
                        ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-60">Trading Style</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Scalper', 'Day Trader', 'Swing Trader', 'Investor'].map((style) => (
                            <button
                                key={style}
                                onClick={() => setFormData({...formData, tradingStyle: style as any})}
                                className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                                    formData.tradingStyle === style 
                                    ? 'border-[#FF4F01] bg-[#FF4F01]/5' 
                                    : isDarkMode ? 'border-zinc-800 bg-[#111]' : 'border-zinc-100 bg-white shadow-sm'
                                }`}
                            >
                                <div className="font-bold text-sm mb-1">{style}</div>
                                {formData.tradingStyle === style && <div className="absolute top-3 right-3 text-[#FF4F01]"><Check size={14} /></div>}
                            </button>
                        ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Terms of Service & Privacy Policy</h1>
               <p className={`text-lg mb-10 ${subTextColor}`}>Please review and accept our terms and privacy policy to continue.</p>
               
               <div className="space-y-6">
                  <div className={`p-8 rounded-xl border h-96 overflow-y-auto custom-scrollbar leading-relaxed text-sm ${isDarkMode ? 'bg-[#111] border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`} ref={scrollRef} onScroll={handleScroll}>
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase text-xs tracking-widest">Terms of Use / Service Agreement</h3>
                    <p className="mb-4">Date of last revision: October 24, 2024</p>
                    <p className="mb-6">This agreement is between JournalFX Technologies ("the Company") and the user. By using this software, you acknowledge that trading foreign exchange on margin carries a high level of risk and may not be suitable for all investors.</p>
                    <p className="mb-4 font-bold uppercase text-zinc-800 dark:text-zinc-200">1. RISK DISCLOSURE</p>
                    <p className="mb-6">The high degree of leverage can work against you as well as for you. Before deciding to invest in foreign exchange you should carefully consider your investment objectives, level of experience, and risk appetite.</p>
                    <div className="h-20" />
                  </div>

                  <div className="space-y-4 pt-4">
                     <div className="flex items-center justify-between py-4 border-b border-zinc-200 dark:border-zinc-800">
                        <span className="text-sm font-bold opacity-80">I agree to JournalFX's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.</span>
                        <div className="flex items-center gap-4">
                           {!isAtBottom && <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mr-2">Scroll to bottom</span>}
                           <button 
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                            className={`w-12 h-6 rounded-full relative transition-all ${agreedToTerms ? 'bg-[#FF4F01]' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                           >
                             <div className={`absolute top-1 w-4 h-4 bg-white transition-all shadow-sm ${agreedToTerms ? 'left-7' : 'left-1'}`} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Choose your plan</h1>
               <p className={`text-lg mb-12 ${subTextColor}`}>Select a plan to access professional metrics. You can always change later.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                     { name: 'Free Plan', desc: 'Lightweight journaling. Manual entry only.', price: '0', limit: '50 trades / mo', highlight: false, tag: 'Starter' },
                     { name: 'Hobby', desc: 'Great for retail traders.', price: '19', limit: '500 trades / mo', highlight: false, tag: 'Popular' },
                     { name: 'Standard', desc: 'AI tools and unlimited sync.', price: '49', limit: 'Unlimited trades', highlight: true, tag: 'Most popular' },
                     { name: 'Growth', desc: 'Built for high frequency.', price: '199', limit: 'Enterprise Support', highlight: false, tag: 'Pro' }
                  ].map((plan, idx) => (
                     <div key={idx} className={`p-8 rounded-2xl border-2 flex flex-col h-full relative ${plan.highlight ? 'border-[#FF4F01]' : isDarkMode ? 'bg-[#111] border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
                        {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4F01] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest">{plan.tag}</div>}
                        <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
                        <p className="text-sm opacity-50 mb-8 min-h-[60px]">{plan.desc}</p>
                        <div className="flex items-center gap-2 mb-10 text-zinc-500">
                           <Flame size={18} className={plan.highlight ? 'text-[#FF4F01]' : ''} /> 
                           <span className="text-sm font-bold uppercase tracking-widest">{plan.limit}</span>
                        </div>
                        <div className="mt-auto">
                           <div className="mb-6"><span className="text-5xl font-black">{formData.currencySymbol}{plan.price}</span> <span className="text-xs opacity-50 uppercase font-bold tracking-widest">{idx === 0 ? 'one-time' : '/monthly'}</span></div>
                           <button onClick={() => handleSelectPlan(plan.name)} className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${plan.highlight ? 'bg-[#FF4F01] text-white hover:bg-[#e64601] shadow-lg shadow-[#FF4F01]/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}>
                              {idx === 0 ? 'Get started' : 'Subscribe'}
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Sync Technology</h1>
               <p className={`text-lg mb-12 ${subTextColor}`}>Choose how you want to import your trading data.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                     onClick={() => handleSelectSync('Manual')}
                     className={`p-10 rounded-[32px] border-2 text-left transition-all group relative overflow-hidden ${
                        formData.syncMethod === 'Manual' 
                        ? 'border-[#FF4F01] bg-[#FF4F01]/5' 
                        : isDarkMode ? 'border-zinc-800 bg-[#111]' : 'border-zinc-100 bg-white shadow-sm'
                     }`}
                  >
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-colors ${formData.syncMethod === 'Manual' ? 'bg-[#FF4F01] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        <ShieldCheck size={28} />
                     </div>
                     <h3 className="text-2xl font-black mb-3">Manual Entry</h3>
                     <p className="text-sm opacity-50 leading-relaxed mb-6">Standard journaling workflow. Manually record every trade with detailed psychology logging.</p>
                     <ul className="space-y-2">
                        {['Pure focus', 'Detailed metrics', 'Psychology logging'].map(item => (
                           <li key={item} className="flex items-center gap-2 text-xs font-bold opacity-60 uppercase tracking-widest">
                              <Check size={14} className="text-[#FF4F01]" /> {item}
                           </li>
                        ))}
                     </ul>
                     {formData.syncMethod === 'Manual' && <div className="absolute top-8 right-8 text-[#FF4F01]"><CheckCircle2 size={32} /></div>}
                  </button>

                  <button 
                     onClick={() => handleSelectSync('EA_CONNECT')}
                     className={`p-10 rounded-[32px] border-2 text-left transition-all group relative overflow-hidden ${
                        formData.syncMethod === 'EA_CONNECT' 
                        ? 'border-[#FF4F01] bg-[#FF4F01]/5' 
                        : isDarkMode ? 'border-zinc-800 bg-[#111]' : 'border-zinc-100 bg-white shadow-sm'
                     }`}
                  >
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-colors ${formData.syncMethod === 'EA_CONNECT' ? 'bg-[#FF4F01] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                        <Cpu size={28} />
                     </div>
                     <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-black">EA CONNECT</h3>
                        <span className="bg-[#FF4F01] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">NEW</span>
                     </div>
                     <p className="text-sm opacity-50 leading-relaxed mb-6">Automated sync with MT4/MT5. Install our bridge EA to sync your live execution data instantly.</p>
                     <ul className="space-y-2">
                        {['Auto-import', 'Real-time equity', 'No manual data entry'].map(item => (
                           <li key={item} className="flex items-center gap-2 text-xs font-bold opacity-60 uppercase tracking-widest">
                              <Check size={14} className="text-[#FF4F01]" /> {item}
                           </li>
                        ))}
                     </ul>
                     {formData.syncMethod === 'EA_CONNECT' && <div className="absolute top-8 right-8 text-[#FF4F01]"><CheckCircle2 size={32} /></div>}
                  </button>
               </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
               <h1 className="text-5xl font-bold tracking-tight mb-4">Account Configuration</h1>
               <p className={`text-lg mb-12 ${subTextColor}`}>Define your primary trading account details and base currency.</p>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
                  <div className="space-y-8">
                     <div className="group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Account Name</label>
                        <div className="relative">
                           <Wallet className="absolute left-0 top-1/2 -translate-y-1/2 text-[#FF4F01]" size={20} />
                           <input 
                              value={formData.accountName}
                              onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                              placeholder="e.g. IC Markets Live"
                              className={`w-full bg-transparent border-b-2 pl-8 py-4 text-xl font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 focus:border-[#FF4F01]' : 'border-zinc-200 focus:border-[#FF4F01]'}`}
                           />
                        </div>
                     </div>
                     <div className="group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-3 block opacity-60">Initial Balance</label>
                        <div className="relative">
                           <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#FF4F01] font-bold text-xl">{formData.currencySymbol}</span>
                           <input 
                              type="number"
                              value={formData.initialBalance}
                              onChange={(e) => setFormData({...formData, initialBalance: parseFloat(e.target.value)})}
                              className={`w-full bg-transparent border-b-2 pl-8 py-4 text-xl font-mono font-bold outline-none transition-all ${isDarkMode ? 'border-zinc-800 focus:border-[#FF4F01]' : 'border-zinc-200 focus:border-[#FF4F01]'}`}
                           />
                        </div>
                     </div>
                  </div>

                  <div>
                     <label className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 block opacity-60 ml-1">Base Currency</label>
                     <div className="grid grid-cols-2 gap-4">
                        {CURRENCIES.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => setFormData({...formData, currency: c.code, currencySymbol: c.symbol})}
                            className={`p-6 rounded-xl border-2 text-left transition-all relative group ${
                              formData.currency === c.code 
                              ? 'border-[#FF4F01] bg-[#FF4F01]/5' 
                              : isDarkMode ? 'border-zinc-800 bg-[#111]' : 'border-zinc-100 bg-white shadow-sm'
                            }`}
                          >
                            <div className="font-black text-lg mb-1">{c.code}</div>
                            <div className="text-[10px] opacity-40 uppercase font-black tracking-widest">{c.name}</div>
                            {formData.currency === c.code && <div className="absolute top-4 right-4 text-[#FF4F01]"><CheckCircle2 size={20} /></div>}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="mt-12 lg:mt-24 pt-10 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
           <button 
             onClick={prevStep}
             className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all border ${
               step === 1 ? 'opacity-0 pointer-events-none' : isDarkMode ? 'border-zinc-800 hover:bg-zinc-900 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600'
             }`}
           >
             <ArrowLeft size={18} /> Back
           </button>

           <div className="flex items-center gap-4">
              {step < 6 ? (
                <div className="flex items-center gap-4">
                    {step === 5 && (
                        <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select Sync Method Above</div>
                    )}
                    {(step < 5 || (step === 5 && formData.syncMethod === 'Manual')) && (
                        <button 
                           onClick={nextStep}
                           disabled={(step === 1 && (!formData.name || !formData.country)) || (step === 3 && !agreedToTerms)}
                           className="flex items-center gap-3 px-12 py-4 bg-[#FF4F01] hover:bg-[#e64601] text-white rounded-xl font-black text-sm shadow-xl shadow-[#FF4F01]/20 disabled:opacity-30 transition-all hover:translate-x-1"
                        >
                           Continue <ArrowRight size={20} />
                        </button>
                    )}
                </div>
              ) : (
                <button 
                   onClick={handleFinish}
                   className="flex items-center gap-3 px-12 py-4 bg-[#FF4F01] hover:bg-[#e64601] text-white rounded-xl font-black text-sm shadow-xl shadow-[#FF4F01]/20 transition-all hover:scale-[1.05]"
                >
                   Get Started
                </button>
              )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default Onboarding;
