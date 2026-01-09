
export const APP_CONSTANTS = {
  STORAGE_KEYS: {
    THEME: 'jfx_theme_mode', // Changed to mode to support future light/dark/system
    THEME_DARK: 'jfx_theme_dark',
  },
  VIEWS: {
    DASHBOARD: 'dashboard',
    LOG_TRADE: 'log-trade',
    JOURNAL: 'history',
    ANALYTICS: 'analytics',
    GOALS: 'goals',
    NOTES: 'notes',
    CHARTS: 'charts',
    DIAGRAMS: 'diagrams',
    CALCULATORS: 'calculators',
    SETTINGS: 'settings',
  },
  TABLES: {
    PROFILES: 'profiles',
    TRADES: 'trades',
    NOTES: 'notes',
    DAILY_BIAS: 'daily_bias',
    GOALS: 'goals',
  },
  PLANS: {
    FREE: 'FREE TIER (JOURNALER)',
    HOBBY: 'PRO TIER (ANALYSTS)',
    STANDARD: 'PREMIUM (MASTERS)',
  },
  CURRENCIES: [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  ]
};
