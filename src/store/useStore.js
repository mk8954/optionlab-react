import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

// Exact Calculator Engine for Database
const calcCharges = (buyPrice, sellPrice, q, isRoundTrip = true) => {
  const buyTO = buyPrice * q;
  const sellTO = isRoundTrip ? (sellPrice * q) : 0;
  const totalTO = buyTO + sellTO;
  const bro = isRoundTrip ? 40.00 : 20.00;
  const stt = Math.round((sellTO * 0.0015) * 100) / 100;
  const txn = Math.round((totalTO * 0.0003503) * 100) / 100;
  const sebi = Math.round((totalTO * 0.000001) * 100) / 100;
  const stamp = Math.round((buyTO * 0.00003) * 100) / 100;
  const gst = Math.round(((bro + txn + sebi) * 0.18) * 100) / 100;
  return bro + stt + txn + sebi + stamp + gst;
};

const initialState = {
  version: 1,
  settings: {
    spotLevels: { NIFTY: 24358.15, BANKNIFTY: 52945.00, FINNIFTY: 23800.00, SENSEX: 77627.50 },
    selectedExpiries: { NIFTY: '', BANKNIFTY: '', FINNIFTY: '', SENSEX: '' },
    generatedExpiries: {
      NIFTY: generateExpiries(2),
      BANKNIFTY: generateExpiries(3),
      FINNIFTY: generateExpiries(2),
      SENSEX: generateExpiries(5)
    },
    lotSizes: { NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 60, SENSEX: 20 },
    theme: 'dark'
  },
  wallet: {
    startingCapital: 1000000,
    availableCash: 814570,
    investedMargin: 0,
  },
  ledger: [],
  trades: [],
  openPositions: [],
};

const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      updateSpotLevel: (index, level) => set((state) => ({
        settings: { ...state.settings, spotLevels: { ...state.settings.spotLevels, [index]: level } }
      })),

      setManualExpiry: (index, date) => set((state) => ({
        settings: { ...state.settings, selectedExpiries: { ...state.settings.selectedExpiries, [index]: date } }
      })),

      executeTrade: (tradePayload) => set((state) => {
        const marginRequired = tradePayload.qty * tradePayload.entryPremium;
        if (state.wallet.availableCash < marginRequired) return state;

        const newPosition = {
          ...tradePayload,
          id: Date.now().toString(),
          marginUsed: marginRequired,
          currentPremium: tradePayload.entryPremium,
          runningPnL: 0,
          entryTime: new Date().toISOString()
        };

        return {
          openPositions: [newPosition, ...state.openPositions],
          wallet: {
            ...state.wallet,
            availableCash: state.wallet.availableCash - marginRequired,
            investedMargin: state.wallet.investedMargin + marginRequired
          }
        };
      }),

      // NEW: Update LTP and recalculate PnL dynamically
      updatePositionLTP: (positionId, newLTP) => set((state) => {
        return {
          openPositions: state.openPositions.map(pos => {
            if (pos.id === positionId) {
              const pnl = (newLTP - pos.entryPremium) * pos.qty;
              return { ...pos, currentPremium: newLTP, runningPnL: pnl };
            }
            return pos;
          })
        };
      }),

      closePosition: (positionId, exitPremium, exitReason) => set((state) => {
        const position = state.openPositions.find(p => p.id === positionId);
        if (!position) return state;

        const grossPnL = (exitPremium - position.entryPremium) * position.qty;

        // Dynamically calculate EXACT charges for this specific trade
        const exactCharges = calcCharges(position.entryPremium, exitPremium, position.qty, true);
        const netPnL = grossPnL - exactCharges;

        const closedTrade = {
          tradeId: position.id,
          date: new Date().toISOString().split('T')[0],
          entryTime: position.entryTime,
          exitTime: new Date().toISOString(),
          index: position.symbol,
          expiry: position.expiry,
          strike: position.strike,
          type: position.type,
          qty: position.qty,
          entryPremium: position.entryPremium,
          exitPremium: exitPremium,
          entryReason: position.entryReason,
          exitReason: exitReason,
          chargesBreakdown: exactCharges,
          grossPnL: grossPnL,
          netPnL: netPnL,
        };

        return {
          openPositions: state.openPositions.filter(p => p.id !== positionId),
          trades: [closedTrade, ...state.trades],
          wallet: {
            ...state.wallet,
            availableCash: state.wallet.availableCash + position.marginUsed + netPnL,
            investedMargin: state.wallet.investedMargin - position.marginUsed
          }
        };
      }),

      resetApp: () => set(initialState)
    }),
    {
      name: 'optionlab-storage',
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          persistedState.settings.lotSizes = initialState.settings.lotSizes;
        }
        return persistedState;
      },
    }
  )
);

export default useStore;
