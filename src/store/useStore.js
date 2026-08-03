import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      // --- APP STATE ---
      profileName: 'Mukesh Kumar',
      wallet: {
        availableCash: 0,
        investedMargin: 0
      },
      openPositions: [],
      trades: [],
      statement: [],

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
        customIndices: [],
        indexOrder: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'],

        // Advanced Index Engine Configuration
        lotSizes: { NIFTY: 25, BANKNIFTY: 15, FINNIFTY: 40, SENSEX: 10, MIDCPNIFTY: 50 },
        stepSizes: { NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, SENSEX: 100, MIDCPNIFTY: 25 },
        expiryRules: {},

        // NEW: Market Types & Trading Rules
        indexTypes: {},
        tradingHours: {},

        defaultTrade: {
          lotSize: 1,
          targetPct: 30,
          slPct: 20
        },
        chargeRates: {
          brokerage: 20,
          stt: 0.125,
          txn: 0.03503,
          sebi: 0.0001,
          stamp: 0.003,
          gst: 18
        }
      },

      // --- ACTIONS ---

      setProfileName: (name) => set({ profileName: name }),

      updateChargeRates: (rates) => set((state) => ({
        settings: { ...state.settings, chargeRates: { ...state.settings.chargeRates, ...rates } }
      })),

      updateDefaultTrade: (defaults) => set((state) => ({
        settings: { ...state.settings, defaultTrade: { ...state.settings.defaultTrade, ...defaults } }
      })),

      updateIndexOrder: (newOrder) => set((state) => ({
        settings: { ...state.settings, indexOrder: newOrder }
      })),

      // NEW: Unified Index Configurator (Handles Categories & Timings)
      saveIndexConfig: (name, config) => set((state) => {
        const isBase = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(name);

        let newCustomIndices = state.settings.customIndices || [];
        if (!isBase && !newCustomIndices.find(c => c.name === name)) {
          newCustomIndices.push({ name });
        }

        const newSpotLevels = { ...state.settings.spotLevels };
        if (!newSpotLevels[name]) newSpotLevels[name] = 1000;

        let newIndexOrder = [...(state.settings.indexOrder || [])];
        if (!newIndexOrder.includes(name)) newIndexOrder.push(name);

        return {
          settings: {
            ...state.settings,
            customIndices: newCustomIndices,
            spotLevels: newSpotLevels,
            indexOrder: newIndexOrder,
            lotSizes: { ...state.settings.lotSizes, [name]: Number(config.lotSize) },
            stepSizes: { ...state.settings.stepSizes, [name]: Number(config.stepSize) },
            expiryRules: {
              ...state.settings.expiryRules,
              [name]: { type: config.expiryFreq, day: config.expiryDay }
            },
            // Save the new category and timing rules
            indexTypes: { ...state.settings.indexTypes, [name]: config.type },
            tradingHours: { ...state.settings.tradingHours, [name]: config.timing }
          }
        };
      }),

      addTransaction: (type, amount, note) => set((state) => {
        const amt = Number(amount);
        const newTx = { id: Date.now(), type, amount: amt, note, date: new Date().toISOString() };

        let newCash = state.wallet.availableCash;
        if (type === 'deposit') newCash += amt;
        if (type === 'withdraw') newCash -= amt;

        return {
          statement: [...(state.statement || []), newTx],
          wallet: { ...state.wallet, availableCash: newCash }
        };
      }),

      resetApp: () => set((state) => ({
        wallet: { availableCash: 0, investedMargin: 0 },
        openPositions: [],
        trades: [],
        statement: [],
        profileName: 'Mukesh Kumar'
      })),

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

      generateExpiries: () => set((state) => {
        const exps = {};

        const getNextDates = (targetDayStr, count = 4, isLastOfMonth = false) => {
          const dayMap = { 'Sunday':0, 'Monday':1, 'Tuesday':2, 'Wednesday':3, 'Thursday':4, 'Friday':5, 'Saturday':6 };
          const targetDay = dayMap[targetDayStr];
          const dates = [];
          let d = new Date();

          if (!isLastOfMonth) {
            d.setDate(d.getDate() + ((targetDay + 7 - d.getDay()) % 7));
            for (let i = 0; i < count; i++) {
              dates.push(new Date(d).toISOString().split('T')[0]);
              d.setDate(d.getDate() + 7);
            }
          } else {
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

        const baseRules = {
          NIFTY: { type: 'Weekly', day: 'Thursday' },
          BANKNIFTY: { type: 'Monthly', day: 'Wednesday' },
          FINNIFTY: { type: 'Monthly', day: 'Tuesday' },
          SENSEX: { type: 'Weekly', day: 'Friday' },
          MIDCPNIFTY: { type: 'Weekly', day: 'Monday' }
        };

        const customRules = state.settings.expiryRules || {};
        const activeRules = { ...baseRules, ...customRules };

        Object.keys(activeRules).forEach(idxName => {
          const rule = activeRules[idxName];
          const isLast = rule.type === 'Monthly';
          exps[idxName] = getNextDates(rule.day, 4, isLast);
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
        const rates = state.settings.chargeRates;

        const buyTurnover = pos.entryPremium * pos.qty;
        const sellTurnover = exitPremium * pos.qty;
        const totalTurnover = buyTurnover + sellTurnover;

        const bro = Number(rates.brokerage) * 2;
        const stt = sellTurnover * (Number(rates.stt) / 100);
        const txn = totalTurnover * (Number(rates.txn) / 100);
        const sebi = totalTurnover * (Number(rates.sebi) / 100);
        const stamp = buyTurnover * (Number(rates.stamp) / 100);
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
          chargesBreakdown: { bro, stt, txn, sebi, stamp, gst, total: totalCharges },
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
    { name: 'optionlab-storage-v7' } // Bumped version to initialize new timing data
  )
);

export default useStore;
