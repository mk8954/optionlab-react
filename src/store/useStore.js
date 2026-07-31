import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Utility: Generate next 4 expiries ---
const generateExpiries = (targetDay) => {
  const dates = [];
  let d = new Date();
  let day = d.getDay();
  let diff = (targetDay + 7 - day) % 7;
  if (diff === 0) diff = 7;
  d.setDate(d.getDate() + diff);

  for(let i=0; i<4; i++) {
    dates.push(new Date(d.getTime() + (i * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
  }
  return dates;
};

// --- Initial State Schema exactly as requested ---
const initialState = {
  settings: {
    spotLevels: {
      NIFTY: 24358.15,
      BANKNIFTY: 52945.00,
      FINNIFTY: 23800.00,
      MIDCPNIFTY: 12500.00,
      SENSEX: 77627.50
    },
    selectedExpiries: {
      NIFTY: '',
      BANKNIFTY: '',
      FINNIFTY: '',
      MIDCPNIFTY: '',
      SENSEX: ''
    },
    generatedExpiries: {
      NIFTY: generateExpiries(2), // Tuesday
      BANKNIFTY: generateExpiries(3), // Wednesday
      FINNIFTY: generateExpiries(2), // Tuesday
      MIDCPNIFTY: generateExpiries(1), // Monday
      SENSEX: generateExpiries(5) // Friday
    },
    lotSizes: { NIFTY: 25, BANKNIFTY: 15, FINNIFTY: 40, MIDCPNIFTY: 75, SENSEX: 10 },
    theme: 'dark',
    defaultSLPct: 10,
    defaultTargetPct: 20,
    maxTradesPerDay: 3
  },

  wallet: {
    startingCapital: 1000000,
    availableCash: 814570,
    investedMargin: 185430,
    lockedMargin: 0,
    remainingDepositLimit: 5000,
    lastDepositDate: null
  },

  ledger: [], // { id, date, type, amount, balanceAfter, remarks }

  trades: [], // Trade Journal (Closed Trades)

  openPositions: [], // { id, symbol, strike, type, qty, entryPremium, marginUsed, currentPremium, runningPnL }

  dailySessions: [], // { date, tradeCount, dailyPnL, win, loss, best, worst, maxDrawdown, profitHit, lossHit }

  rules: {
    maxTradesPerDay: 3,
    dailyLossLimit: -5000,
    dailyProfitTarget: 10000,
    maxDepositAtOnce: 5000,
    depositCooldownDays: 10,
    tradingEnabled: true
  }
};

// --- Zustand Store Creation with Persistence ---
const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // 1. Settings Actions
      updateSpotLevel: (index, level) => set((state) => ({
        settings: { ...state.settings, spotLevels: { ...state.settings.spotLevels, [index]: level } }
      })),

      setManualExpiry: (index, date) => set((state) => ({
        settings: { ...state.settings, selectedExpiries: { ...state.settings.selectedExpiries, [index]: date } }
      })),

      // 2. Trading Actions (The Core Architecture)
      executeTrade: (tradePayload) => set((state) => {
        // Here you would check rules engine limits before returning
        if (!state.rules.tradingEnabled) return state;

        const marginRequired = tradePayload.qty * tradePayload.entryPremium;
        if (state.wallet.availableCash < marginRequired) return state; // Insufficient funds

        const newPosition = {
          ...tradePayload,
          id: Date.now().toString(),
          marginUsed: marginRequired,
          runningPnL: 0
        };

        return {
          openPositions: [...state.openPositions, newPosition],
          wallet: {
            ...state.wallet,
            availableCash: state.wallet.availableCash - marginRequired,
            investedMargin: state.wallet.investedMargin + marginRequired
          }
        };
      }),

      closePosition: (positionId, exitPremium, exitReason) => set((state) => {
        const position = state.openPositions.find(p => p.id === positionId);
        if (!position) return state;

        const grossPnL = (exitPremium - position.entryPremium) * position.qty;
        const charges = 60; // Calculate dynamic brokerage here
        const netPnL = grossPnL - charges;

        const closedTrade = {
          tradeId: position.id,
          date: new Date().toISOString().split('T')[0],
          entryTime: position.entryTime, // Assuming added in executeTrade
          exitTime: new Date().toISOString(),
          index: position.symbol,
          expiry: position.expiry,
          strike: position.strike,
          type: position.type,
          buySell: position.buySell,
          qty: position.qty,
          entryPremium: position.entryPremium,
          exitPremium: exitPremium,
          entryReason: exitReason,
          chargesBreakdown: charges,
          grossPnL: grossPnL,
          netPnL: netPnL,
          status: 'Closed',
          holdingDuration: '1h 30m', // Calculated dynamically
          riskReward: '1:2' // Calculated dynamically based on SL/Target configs
        };

        return {
          openPositions: state.openPositions.filter(p => p.id !== positionId),
          trades: [...state.trades, closedTrade],
          wallet: {
            ...state.wallet,
            availableCash: state.wallet.availableCash + position.marginUsed + netPnL,
            investedMargin: state.wallet.investedMargin - position.marginUsed
          }
          // Note: Logic to update dailySessions would also hook in right here.
        };
      }),

      // 3. Backup System Actions (Import / Export JSON)
      exportBackup: () => {
        const data = get();
        // Remove zustand specific functions before exporting
        const dataToExport = JSON.stringify({
          settings: data.settings,
          wallet: data.wallet,
          ledger: data.ledger,
          trades: data.trades,
          openPositions: data.openPositions,
          dailySessions: data.dailySessions,
          rules: data.rules
        });

        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OptionLab_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      },

      importBackup: (jsonData) => set((state) => {
        try {
          const parsed = JSON.parse(jsonData);
          return { ...state, ...parsed };
        } catch (e) {
          console.error("Invalid Backup File");
          return state;
        }
      }),

      // Developer tool to reset state
      resetApp: () => set(initialState)

    }),
    {
      name: 'optionlab-storage', // The key used in localStorage
      // We can define partialize here if we want to exclude certain things from localstorage
    }
  )
);

export default useStore;
