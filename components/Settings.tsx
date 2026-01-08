
import React, { useState } from 'react';
import {
  User, Globe, Wallet, DollarSign, Zap,
  Shield, Bell, Save, Trash2, CreditCard,
  ChevronRight, ArrowRight, CheckCircle2,
  Lock, Mail, Smartphone, ExternalLink,
  Flame, Award, Briefcase, Camera, Palette,
  Sun, Moon, Copy, Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { APP_CONSTANTS } from '../lib/constants';
import { Select } from './Select';

// Journaler Bots (Free Tier)
const freeAvatars = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=1&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=2&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=3&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=4&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=5&backgroundColor=f1f5f9',
  'https://api.dicebear.com/7.x/bottts/svg?seed=6&backgroundColor=f1f5f9',
];

// AI Analysts (Pro Tier)
const proAvatars = [
  'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=1&backgroundColor=e9d5ff&primaryColor=a855f7,c026d3,d8b4fe&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/bottts-neutral/svg?seed=2&backgroundColor=e9d5ff&primaryColor=a855f7,c026d3,d8b4fe&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/thumbs/svg?seed=1&backgroundColor=e9d5ff,d8b4fe,c084fc&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=1&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=2&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
  'https://api.dicebear.com/8.x/identicon/svg?seed=3&backgroundColor=fefce8,fef9c3,fef08a&backgroundType=gradientLinear',
];

// Elite AI Masters (Premium Tier)
const premiumAvatars = [
  'https://api.dicebear.com/7.x/lorelei/svg?seed=1&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=2&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=3&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=1&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=2&backgroundColor=c7d2fe',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=3&backgroundColor=c7d2fe',
];

interface SettingsProps {
  isDarkMode: boolean;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => Promise<void>;
  onLogout: () => void;
  onToggleTheme: () => void;
}

const Settings: React.FC<SettingsProps> = ({ isDarkMode, userProfile, onUpdateProfile, onLogout, onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'appearance' | 'billing' | 'security'>('profile');
  const [formData, setFormData] = useState<UserProfile>({ ...userProfile });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveStatus] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProfile(formData);
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyKey = () => {
    if (formData.syncKey) {
      navigator.clipboard.writeText(formData.syncKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const inputClasses = `w-full bg-transparent border-b-2 py-3 text-lg font-bold outline-none transition-all ${isDarkMode
    ? 'border-zinc-800 focus:border-[#FF4F01] text-white'
    : 'border-zinc-200 focus:border-[#FF4F01] text-zinc-900'
    }`;

  const labelClasses = "text-[10px] font-black uppercase tracking-[0.2em] opacity-50 block mb-1";

  return (
    <div className={`w-full h-full overflow-hidden flex flex-col p-8 font-sans ${isDarkMode ? 'bg-[#09090b] text-zinc-200' : 'bg-slate-50 text-slate-900'}`}>
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-2">Settings</h1>
        <p className="text-sm opacity-50 font-medium text-zinc-500">Manage your trading persona and application preferences.</p>
      </header>

      <div className="flex-1 flex gap-12 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 flex flex-col gap-2 shrink-0">
          {[
            { id: 'profile', label: 'Trading Persona', icon: User },
            { id: 'account', label: 'Account Config', icon: Briefcase },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
            { id: 'security', label: 'Security', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                ? 'bg-[#FF4F01] text-white shadow-lg shadow-[#FF4F01]/20'
                : `hover:bg-black/5 dark:hover:bg-white/5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}

          <div className="mt-auto pt-6 border-t border-dashed border-zinc-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-500/10 transition-all"
            >
              <Trash2 size={18} /> Logout Account
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className={`flex-1 rounded-3xl border overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#18181b] border-[#27272a]' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className={`p-10 ${activeTab === 'profile' ? 'max-w-full' : 'max-w-2xl'}`}>
            {activeTab === 'profile' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  {/* Left Column: Profile Info */}
                  <div className="xl:col-span-5 space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-2xl overflow-hidden">
                          {formData.avatarUrl ? (
                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black mb-1">{formData.name}</h3>
                        <p className="text-xs font-bold text-[#FF4F01] uppercase tracking-widest">{formData.plan}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="group">
                        <label className={labelClasses}>Full Name</label>
                        <input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={inputClasses}
                        />
                      </div>
                      <div className="group">
                        <label className={labelClasses}>Country</label>
                        <div className="relative">
                          <Globe className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                          <input
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className={inputClasses + " pl-8"}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                          <label className={labelClasses}>Trading Style</label>
                          <Select
                            value={formData.tradingStyle}
                            onChange={(val) => setFormData({ ...formData, tradingStyle: val as any })}
                            options={['Scalper', 'Day Trader', 'Swing Trader', 'Investor'].map(s => ({ value: s, label: s }))}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                        <div className="group">
                          <label className={labelClasses}>Experience Level</label>
                          <Select
                            value={formData.experienceLevel}
                            onChange={(val) => setFormData({ ...formData, experienceLevel: val as any })}
                            options={['Beginner', 'Intermediate', 'Advanced', 'Pro'].map(s => ({ value: s, label: s }))}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Avatar Selection */}
                  <div className="xl:col-span-7 space-y-6">
                    <h3 className="text-lg font-bold mb-2">Choose Your Avatar</h3>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Free Tier (Journaler Bots)</h4>
                      <div className="grid grid-cols-6 gap-4">
                        {freeAvatars.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setFormData({ ...formData, avatarUrl: url })}
                            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          >
                            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Pro Tier (AI Analysts)</h4>
                        <div className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase">Pro</div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        {proAvatars.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setFormData({ ...formData, avatarUrl: url })}
                            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          >
                            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-60">Premium Tier (Elite Masters)</h4>
                        <div className="px-2 py-0.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black uppercase">Elite</div>
                      </div>
                      <div className="grid grid-cols-6 gap-4">
                        {premiumAvatars.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setFormData({ ...formData, avatarUrl: url })}
                            className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${formData.avatarUrl === url ? 'border-[#FF4F01] ring-2 ring-[#FF4F01]/20' : 'border-transparent opacity-80 hover:opacity-100'}`}
                          >
                            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 gap-10">
                  <div className="group">
                    <label className={labelClasses}>Primary Account Name</label>
                    <input
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="group">
                      <label className={labelClasses}>Base Currency</label>
                      <Select
                        value={formData.currency}
                        onChange={(val) => {
                          const selected = APP_CONSTANTS.CURRENCIES.find(c => c.code === val);
                          if (selected) {
                            setFormData({ ...formData, currency: selected.code, currencySymbol: selected.symbol });
                          }
                        }}
                        options={APP_CONSTANTS.CURRENCIES.map(c => ({ value: c.code, label: `${c.code} (${c.symbol})` }))}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                    <div className="group">
                      <label className={labelClasses}>Initial Balance</label>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#FF4F01] font-bold text-xl">{formData.currencySymbol}</span>
                        <input
                          type="number"
                          value={formData.initialBalance}
                          onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
                          className={inputClasses + " pl-8 font-mono"}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label className={labelClasses}>Sync Method</label>
                    <div className="flex items-center gap-3 pt-3">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${formData.eaConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}`}>
                        {formData.syncMethod === 'EA_CONNECT' ? 'EA Sync Active' : 'Manual Entry'}
                      </span>
                      <button className="text-[10px] font-black text-[#FF4F01] uppercase underline">Change</button>
                    </div>
                  </div>

                  {formData.syncMethod === 'EA_CONNECT' && (
                    <div className="space-y-6">
                      <div className={`p-6 rounded-2xl border-2 border-dashed ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-200'}`}>
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 block">Your Active Sync Key</label>
                        <div className="flex items-center gap-4">
                          <div className="font-mono text-xl font-black tracking-wider text-[#FF4F01]">
                            {formData.syncKey || 'NOT_GENERATED'}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleCopyKey}
                              className={`p-2 rounded-lg transition-all ${copiedKey ? 'bg-emerald-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                              title="Copy Sync Key"
                            >
                              {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${formData.eaConnected ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                              {formData.eaConnected ? 'Connected' : 'Disconnected'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">Auto-Journal MT5 Trades</p>
                            <p className="text-xs opacity-50">Automatically add closed trades to your journal.</p>
                          </div>
                          <button
                            onClick={() => setFormData({ ...formData, autoJournal: !formData.autoJournal })}
                            className={`w-12 h-6 rounded-full transition-all relative ${formData.autoJournal ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.autoJournal ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-600'}`}>
                        {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                      </div>
                      <div>
                        <p className="text-lg font-bold">Display Mode</p>
                        <p className="text-sm opacity-50">{isDarkMode ? 'Dark mode' : 'Light mode'} is currently active.</p>
                      </div>
                    </div>
                    <button
                      onClick={onToggleTheme}
                      className={`w-14 h-8 rounded-full relative transition-all ${isDarkMode ? 'bg-indigo-600' : 'bg-amber-500'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-lg ${isDarkMode ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`p-8 rounded-[32px] border-2 border-[#FF4F01] bg-[#FF4F01]/5 relative overflow-hidden`}>
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#FF4F01]/20 rounded-full blur-3xl" />
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-60">Current Plan</h4>
                      <h3 className="text-4xl font-black mb-2">{formData.plan}</h3>
                      <p className="text-sm font-medium opacity-60 mb-8">Unlimited trades, AI insights, and EA sync.</p>
                      <button className="px-6 py-3 bg-white text-black rounded-xl text-sm font-black shadow-xl hover:scale-105 transition-transform">
                        Manage Subscription
                      </button>
                    </div>
                    <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <Award size={32} className="text-[#FF4F01]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Next Billing Date</h5>
                    <p className="font-bold">Feb 3, 2026</p>
                  </div>
                  <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                    <h5 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Payment Method</h5>
                    <p className="font-bold flex items-center gap-2">•••• 4242 <CreditCard size={14} /></p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><Mail size={20} /></div>
                      <div>
                        <p className="text-sm font-bold">Email Authentication</p>
                        <p className="text-xs opacity-50">Verified: phemelo@example.com</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase underline">Change</button>
                  </div>
                  <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Lock size={20} /></div>
                      <div>
                        <p className="text-sm font-bold">Two-Factor Auth</p>
                        <p className="text-xs opacity-50">Enabled via Authenticator App</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black uppercase underline text-rose-500">Disable</button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-16 pt-8 border-t border-zinc-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {saveMessage && (
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-left-2">
                    <CheckCircle2 size={14} /> {saveMessage}
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-3 px-10 py-4 bg-[#FF4F01] text-white rounded-2xl font-black text-sm shadow-2xl shadow-[#FF4F01]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Settings'} <Save size={18} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
