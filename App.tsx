
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LogTrade from './components/LogTrade';
import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Analytics from './components/Analytics';
import Auth from './components/Auth';

import Goals from './components/Goals';
import Notes from './components/Notes';
import PositionSizeCalculator from './components/PositionSizeCalculator';
import ChartGrid from './components/ChartGrid';
import DiagramEditor from './components/DiagramEditor';
import Calculators from './components/Calculators';
import Onboarding from './components/Onboarding';
import Settings from './components/Settings';
import EASetup from './components/EASetup';
import ConfirmationModal from './components/ConfirmationModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Trade, Note, DailyBias, UserProfile, Goal } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  // Persistent State (Theme only)
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>('jfx_theme_dark', true);

  // App State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [dailyBias, setDailyBias] = useState<DailyBias[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [eaSession, setEASession] = useState<any>(null);

  // Auth & Loading State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    showCancel?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { }
  });

  // Initial Data Fetch
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
          await loadUserData(user.id);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // EA Session Subscription
  useEffect(() => {
    if (userProfile?.syncKey && isAuthenticated) {
        const fetchSession = async () => {
            try {
                const session = await dataService.getEASession(userProfile.syncKey!);
                if (session) setEASession(session);
            } catch (err) {
                console.error("Error fetching EA session:", err);
            }
        };
        fetchSession();

        // Use a more robust subscription without the string filter to avoid case-sensitivity issues
        const channel = supabase
            .channel('app_ea_sync_global')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ea_sessions'
            }, (payload) => {
                // Manually filter for the user's syncKey
                if (payload.new && (payload.new as any).syncKey === userProfile.syncKey) {
                    setEASession(payload.new);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Realtime connected for EA Sync');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }
}, [userProfile?.syncKey, isAuthenticated]);

  const loadUserData = async (userId: string) => {
    try {
      const { data: profile } = await authService.getProfile(userId);
      if (profile) {
        const mappedProfile: UserProfile = {
          name: profile.name || '',
          country: profile.country || '',
          accountName: profile.account_name || 'Primary Account',
          initialBalance: profile.initial_balance || 0,
          currency: profile.currency || 'USD',
          currencySymbol: profile.currency_symbol || '$',
          syncMethod: profile.sync_method || 'Manual',
          experienceLevel: profile.experience_level || 'Beginner',
          tradingStyle: profile.trading_style || 'Day Trader',
          onboarded: profile.onboarded || false,
          plan: profile.plan || 'Free Plan',
          syncKey: profile.sync_key,
          eaConnected: profile.ea_connected || false,
          autoJournal: profile.auto_journal || false,
          avatarUrl: profile.avatar_url,
        };
        setUserProfile(mappedProfile);
      }

      const [fetchedTrades, fetchedNotes, fetchedBias, fetchedGoals] = await Promise.all([
        dataService.getTrades(),
        dataService.getNotes(),
        dataService.getDailyBias(),
        dataService.getGoals()
      ]);

      setTrades(fetchedTrades);
      setNotes(fetchedNotes);
      setDailyBias(fetchedBias);
      setGoals(fetchedGoals);
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // --- Trade Handlers ---
  const handleAddTrade = async (trade: Trade) => {
    try {
      if (editingTrade) {
        await dataService.updateTrade(trade);
        setTrades(trades.map(t => t.id === trade.id ? trade : t));
        setEditingTrade(null);
      } else {
        const newTrade = await dataService.addTrade(trade);
        setTrades([newTrade, ...trades]);
      }
      setCurrentView('history');
    } catch (error) {
      console.error("Error saving trade:", error);
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        description: 'Failed to save trade. Please try again.',
        confirmText: 'OK',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      });
    }
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setCurrentView('log-trade');
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    try {
      await dataService.updateTrade(updatedTrade);
      setTrades(trades.map(t => t.id === updatedTrade.id ? updatedTrade : t));
    } catch (error) {
      console.error("Error updating trade:", error);
    }
  };

  const handleDeleteTrades = async (tradeIds: string[]) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Trades',
      description: `Are you sure you want to delete ${tradeIds.length} trade(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await dataService.deleteTrades(tradeIds);
          setTrades(trades.filter(t => !tradeIds.includes(t.id)));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Error deleting trades:", error);
        }
      }
    });
  };

  // --- Bias Handlers ---
  const handleUpdateBias = async (bias: DailyBias) => {
    try {
      await dataService.updateBias(bias);
      const existing = dailyBias.findIndex(b => b.date === bias.date);
      if (existing > -1) {
        const updated = [...dailyBias];
        updated[existing] = bias;
        setDailyBias(updated);
      } else {
        setDailyBias([...dailyBias, bias]);
      }
    } catch (error) {
      console.error("Error updating bias:", error);
    }
  };

  // --- Note Handlers ---
  const handleAddNote = async (note: Note) => {
    try {
      const newNote = await dataService.addNote(note);
      setNotes([newNote, ...notes]);
      return newNote;
    } catch (error) {
      console.error("Error adding note:", error);
      throw error;
    }
  };

  const handleUpdateNote = async (note: Note) => {
    try {
      await dataService.updateNote(note);
      setNotes(notes.map(n => n.id === note.id ? note : n));
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await dataService.deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // --- Goal Handlers ---
  const handleAddGoal = async (goal: Goal) => {
    try {
      const newGoal = await dataService.addGoal(goal);
      setGoals([newGoal, ...goals]);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateGoal = async (goal: Goal) => {
    try {
      await dataService.updateGoal(goal);
      setGoals(goals.map(g => g.id === goal.id ? goal : g));
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await dataService.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    try {
      await dataService.updateProfile(profile);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    // Set state immediately for instant UI transition
    setUserProfile(profile);
    setCurrentView('dashboard');
    setTrades([]);

    try {
      await dataService.updateProfile(profile);
    } catch (error) {
      console.error("Error saving profile:", error);
      setConfirmModal({
        isOpen: true,
        title: 'Profile Error',
        description: 'Failed to save profile. Please check your connection and try again.',
        confirmText: 'OK',
        variant: 'danger',
        showCancel: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleLogout = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Log Out',
      description: 'Are you sure you want to log out of your account?',
      confirmText: 'Log Out',
      variant: 'info',
      onConfirm: async () => {
        await authService.signOut();
        setIsAuthenticated(false);
        setUserProfile(null);
        setTrades([]);
        setNotes([]);
        setDailyBias([]);
        setGoals([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Ensure body follows theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#050505';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#F8FAFC';
    }
  }, [isDarkMode]);

  if (isLoading) {
    return (
      <div className={`flex h-screen w-full items-center justify-center ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4F01]"></div>
      </div>
    );
  }

  // Auth Flow
  if (!isAuthenticated) {
    return (
      <Auth
        isDarkMode={isDarkMode}
        onLogin={async () => {
          setIsLoading(true);
          setIsAuthenticated(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) await loadUserData(user.id);
          } catch (error) {
            console.error("Login data load failed:", error);
          } finally {
            setIsLoading(false);
          }
        }}
        onRegister={async () => {
          setIsLoading(true);
          setIsAuthenticated(true);
          try {
            const user = await authService.getCurrentUser();
            if (user) await loadUserData(user.id);
          } catch (error) {
            console.error("Registration data load failed:", error);
          } finally {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  if (!userProfile || !userProfile.onboarded) {
    return <Onboarding isDarkMode={isDarkMode} onComplete={handleOnboardingComplete} />;
  }

  const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
  // Centralized currentBalance logic: use bridge equity if connected, otherwise fallback to journal PnL
  const currentBalance = eaSession?.data?.account?.equity !== undefined 
    ? eaSession.data.account.equity 
    : userProfile.initialBalance + totalPnL;

  return (
    <ErrorBoundary isDarkMode={isDarkMode}>
      <div className={`flex h-screen w-full transition-colors duration-300 ${isDarkMode ? 'bg-[#050505] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>

        {isCalculatorOpen && (
          <PositionSizeCalculator
            isOpen={isCalculatorOpen}
            onClose={() => setIsCalculatorOpen(false)}
            isDarkMode={isDarkMode}
            initialBalance={currentBalance}
            currencySymbol={userProfile.currencySymbol}
          />
        )}

        {!isFocusMode && (
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onOpenCalculator={() => setIsCalculatorOpen(true)}
            onLogout={handleLogout}
            userProfile={userProfile}
          />
        )}

        <main className="flex-1 h-full overflow-hidden relative">
          {currentView === 'dashboard' && (
            <Dashboard
              isDarkMode={isDarkMode}
              trades={trades}
              dailyBias={dailyBias}
              onUpdateBias={handleUpdateBias}
              userProfile={userProfile}
              onViewChange={setCurrentView}
              eaSession={eaSession}
            />
          )}
          {currentView === 'log-trade' && (
            <LogTrade
              isDarkMode={isDarkMode}
              onSave={handleAddTrade}
              initialTrade={editingTrade || undefined}
              onCancel={() => { setEditingTrade(null); setCurrentView('history'); }}
              currencySymbol={userProfile.currencySymbol}
            />
          )}
          {currentView === 'history' && (
            <Journal
              isDarkMode={isDarkMode}
              trades={trades}
              onUpdateTrade={handleUpdateTrade}
              onDeleteTrades={handleDeleteTrades}
              onEditTrade={handleEditTrade}
              userProfile={userProfile}
            />
          )}
          {currentView === 'analytics' && userProfile && <Analytics isDarkMode={isDarkMode} trades={trades} userProfile={userProfile} eaSession={eaSession} />}

          {currentView === 'goals' && userProfile && (
            <Goals
              isDarkMode={isDarkMode}
              trades={trades}
              goals={goals}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              currencySymbol={userProfile.currencySymbol}
            />
          )}
          {currentView === 'notes' && (
            <Notes
              isDarkMode={isDarkMode}
              notes={notes}
              goals={goals}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              onUpdateGoal={handleUpdateGoal}
            />
          )}
          {currentView === 'charts' && (
            <ChartGrid
              isDarkMode={isDarkMode}
              isFocusMode={isFocusMode}
              onToggleFocus={() => setIsFocusMode(!isFocusMode)}
            />
          )}
          {currentView === 'diagrams' && <DiagramEditor isDarkMode={isDarkMode} />}
          {currentView === 'ea-setup' && userProfile && (
            <EASetup 
              isDarkMode={isDarkMode} 
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
          {currentView === 'calculators' && userProfile && (
            <Calculators
              isDarkMode={isDarkMode}
              currencySymbol={userProfile.currencySymbol}
            />
          )}
          {currentView === 'settings' && userProfile && (
            <Settings
              isDarkMode={isDarkMode}
              userProfile={userProfile}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          variant={confirmModal.variant}
          showCancel={confirmModal.showCancel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
          isDarkMode={isDarkMode}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;