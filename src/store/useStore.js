import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // --- APP STATE ---
      profileName: 'Mukesh Kumar',
      wallet: {
        availableCash: 0, // Starts at 0
        investedMargin: 0
      },
      openPositions: [],
      trades: [],
      statement: [], // Tracks deposits and withdrawals

      // --- CONFIGURATION ---
      settings: {
        spotLevels: {
          NIFTY: 24105.35,
          BANKNIFTY: 53057.80,
          FINNIFTY: 23754.80,
          SENSEX: 76765.84,
          MIDCPNIFTY: 12210.15
        },
        selectedExpiries: {},
        generatedExpiries: {},
        customIndices: [], // Store custom added indices
        defaultTrade: {
          lotSize: 1,
          targetPct: 30,
          slPct: 20
        },
        // Dynamic Charge Rates (Brokerage in Flat Rs, others in %)
        chargeRates: {
          brokerage: 20,      // ₹20 Flat per order leg
          stt: 0.125,         // 0.125% on sell turnover
          txn: 0.03503,       // 0.03503% on total turnover
          sebi: 0.0001,       // 0.0001% on total turnover
          stamp: 0.003,       // 0.003% on buy turnover
          gst: 18             // 18% on (Brokerage + Txn + SEBI)
        }
      },

      // --- ACTIONS ---

      // Profile & App Settings
      setProfileName: (name) => set({ profileName: name }),

      updateChargeRates: (rates) => set((state) => ({
        settings: { ...state.settings, chargeRates: { ...state.settings.chargeRates, ...rates } }
      })),

      updateDefaultTrade: (defaults) => set((state) => ({
        settings: { ...state.settings, defaultTrade: { ...state.settings.defaultTrade, ...defaults } }
      })),

      addCustomIndex: (name, lotSize, type, expiryDay) => set((state) => {
        const newIndex = { name, lotSize: Number(lotSize), type, expiryDay };
        return {
          settings: {
            ...state.settings,
            customIndices: [...(state.settings.customIndices || []), newIndex],
            spotLevels: { ...state.settings.spotLevels, [name]: 1000 }
          }
        };
      }),

      // Wallet & Statement
      addTransaction: (type, amount, note) => set((state) => {
        const amt = Number(amount);
        const newTx = {
          id: Date.now(),
          type,
          amount: amt,
          note,
          date: new Date().toISOString()
        };

        let newCash = state.wallet.availableCash;
        if (type === 'deposit') newCash += amt;
        if (type === 'withdraw') newCash -= amt;

        return {
          statement: [...(state.statement || []), newTx],
          wallet: { ...state.wallet, availableCash: newCash }
        };
      }),

      // Reset App to Default State
      resetApp: () => set((state) => ({
        wallet: { availableCash: 0, investedMargin: 0 },
        openPositions: [],
        trades: [],
        statement: [],
        profileName: 'Mukesh Kumar'
      })),

      // Trading Actions
      updateSpotLevel: (indexName, value) => set((state) => ({
        settings: {
          ...state.settings,
          spotLevels: { ...state.settings.spotLevels, [indexName]: value }
        }
      })),

      setManualExpiry: (indexName, dateString) => set((state) => ({
        settings: {
          ...state.settings,
          selectedExpiries: { ...state.settings.selectedExpiries, [indexName]: dateString }
        }
      })),

      // Generates exact Monthly/Weekly dates based on Index
      generateExpiries: () => set((state) => {
        const exps = {};

        const getNextDates = (targetDayStr, count = 4, isLastOfMonth = false) => {
          const dayMap = { 'Sunday':0, 'Monday':1, 'Tuesday':2, 'Wednesday':3, 'Thursday':4, 'Friday':5, 'Saturday':6 };
          const targetDay = dayMap[targetDayStr];
          const dates = [];
          let d = new Date();

          if (!isLastOfMonth) {
            // Weekly logic
            d.setDate(d.getDate() + ((targetDay + 7 - d.getDay()) % 7));
            for (let i = 0; i < count; i++) {
              dates.push(new Date(d).toISOString().split('T')[0]);
              d.setDate(d.getDate() + 7);
            }
          } else {
            // Monthly logic (Last occurrence of day in month)
            for (let i = 0; i < count; i++) {
              let nextMonth = new Date(d.getFullYear(), d.getMonth() + i + 1, 0);
              while (nextMonth.getDay() !== targetDay) {
                nextMonth.setDate(nextMonth.getDate() - 1);
              }
              dates.push(nextMonth.toISOString().split('T')[0]);
            }
          }
          return dates;
        };

        exps['NIFTY'] = getNextDates('Thursday', 4, false); // Weekly
        exps['SENSEX'] = getNextDates('Friday', 4, false); // Weekly
        exps['MIDCPNIFTY'] = getNextDates('Monday', 4, false); // Weekly
        exps['FINNIFTY'] = getNextDates('Tuesday', 4, true); // Monthly
        exps['BANKNIFTY'] = getNextDates('Wednesday', 4, true); // Monthly

        // Custom Indices
        const customIndices = state.settings.customIndices || [];
        customIndices.forEach(idx => {
           const dayStr = idx.expiryDay.includes('Last') ? idx.expiryDay.split(' ')[1] : idx.expiryDay;
           const isLast = idx.expiryDay.includes('Last');
           exps[idx.name] = getNextDates(dayStr, 4, isLast);
        });

        return { settings: { ...state.settings, generatedExpiries: exps } };
      }),

      executeTrade: (tradeData) => set((state) => {
        const marginRequired = tradeData.entryPremium * tradeData.qty;
        const newPos = {
          ...tradeData,
          id: Date.now().toString(),
          marginUsed: marginRequired,
          currentPremium: tradeData.entryPremium,
          runningPnL: 0
        };
        return {
          wallet: {
            availableCash: state.wallet.availableCash - marginRequired,
            investedMargin: state.wallet.investedMargin + marginRequired
          },
          openPositions: [...state.openPositions, newPos]
        };
      }),

      updatePositionLTP: (posId, newLTP) => set((state) => {
        const pos = state.openPositions.find(p => p.id === posId);
        if (!pos) return state;
        const diff = newLTP - pos.entryPremium;
        const pnl = diff * pos.qty;
        return {
          openPositions: state.openPositions.map(p =>
            p.id === posId ? { ...p, currentPremium: newLTP, runningPnL: pnl } : p
          )
        };
      }),

      closePosition: (posId, exitPremium, exitReason, exitNote = '') => set((state) => {
        const pos = state.openPositions.find(p => p.id === posId);
        if (!pos) return state;

        const grossPnL = (exitPremium - pos.entryPremium) * pos.qty;

        // === DYNAMIC EXACT CHARGES MATH ===
        const rates = state.settings.chargeRates;

        const buyTurnover = pos.entryPremium * pos.qty;
        const sellTurnover = exitPremium * pos.qty;
        const totalTurnover = buyTurnover + sellTurnover;

        // Brokerage is flat per leg (2 legs: Buy & Sell)
        const bro = Number(rates.brokerage) * 2;

        // Percentages divided by 100 for actual math
        const stt = sellTurnover * (Number(rates.stt) / 100);
        const txn = totalTurnover * (Number(rates.txn) / 100);
        const sebi = totalTurnover * (Number(rates.sebi) / 100);
        const stamp = buyTurnover * (Number(rates.stamp) / 100);

        // GST applied to taxable components
        const gst = (bro + txn + sebi) * (Number(rates.gst) / 100);

        const totalCharges = bro + stt + txn + sebi + stamp + gst;
        const netPnL = grossPnL - totalCharges;

        const closedTrade = {
          tradeId: pos.id,
          date: new Date().toISOString().split('T')[0],
          index: pos.symbol,
          strike: pos.strike,
          type: pos.type,
          qty: pos.qty,
          entryPremium: pos.entryPremium,
          exitPremium: exitPremium,
          entryTime: pos.entryTime,
          exitTime: new Date().toISOString(),
          grossPnL,
          netPnL,
          chargesBreakdown: {
            bro, stt, txn, sebi, stamp, gst, total: totalCharges
          },
          entryReason: pos.entryReason,
          exitReason,
          exitNote,
          slPrice: pos.slPrice,
          targetPrice: pos.targetPrice
        };

        return {
          wallet: {
            availableCash: state.wallet.availableCash + pos.marginUsed + netPnL,
            investedMargin: state.wallet.investedMargin - pos.marginUsed
          },
          openPositions: state.openPositions.filter(p => p.id !== posId),
          trades: [...state.trades, closedTrade]
        };
      }),

      addTradeLesson: (tradeId, lessonText) => set((state) => ({
        trades: state.trades.map(t =>
          t.tradeId === tradeId ? { ...t, exitNote: lessonText } : t
        )
      }))

    }),
    {
      name: 'optionlab-storage-v5', // Bumped to v5 to apply new dynamic charges structure
    }
  )
);

export default useStore;
