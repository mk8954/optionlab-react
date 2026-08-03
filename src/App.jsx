import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import OptionChain from './components/OptionChain';
import TradeScreen from './components/TradeScreen';
import Positions from './components/Positions';
import Analytics from './components/Analytics';
import More from './components/More';
import useStore from './store/useStore';
import { X, Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal } from 'lucide-react';

const PREV_CLOSES = {
  NIFTY: 24105.35,
  BANKNIFTY: 53057.80,
  FINNIFTY: 23754.80,
  SENSEX: 76765.84,
  MIDCPNIFTY: 12210.15
};

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMarket, setSelectedMarket] = useState('NIFTY');
  const [activeTrade, setActiveTrade] = useState(null);

  // Global Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMode, setConfigMode] = useState('level'); // 'level' or 'percent'

  // Connect to Zustand Store
  const spotLevels = useStore((state) => state.settings?.spotLevels || {});
  const customIndices = useStore((state) => state.settings?.customIndices || []);
  const updateSpotLevel = useStore((state) => state.updateSpotLevel);
  const generateExpiries = useStore((state) => state.generateExpiries);

  // Input states for the modal to prevent typing glitches
  const [spotInputs, setSpotInputs] = useState({});
  const [pctInputs, setPctInputs] = useState({});

  useEffect(() => {
    generateExpiries();
  }, [generateExpiries]);

  // Sync modal form whenever it opens
  useEffect(() => {
    if (showConfigModal) {
      setSpotInputs(spotLevels);

      const initialPcts = {};
      const allIdx = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY', ...customIndices.map(i => i.name)];

      allIdx.forEach(idx => {
        const prev = PREV_CLOSES[idx] || 1000; // Default to 1000 for custom indices if no previous close exists
        const cur = spotLevels[idx] || 0;
        initialPcts[idx] = (((cur - prev) / prev) * 100).toFixed(2);
      });
      setPctInputs(initialPcts);
    }
  }, [spotLevels, showConfigModal, customIndices]);

  const handleSpotChange = (idx, val) => setSpotInputs(p => ({ ...p, [idx]: val }));
  const handlePctChange = (idx, val) => setPctInputs(p => ({ ...p, [idx]: val }));

  const handleSaveModal = () => {
    const allIdx = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY', ...customIndices.map(i => i.name)];

    allIdx.forEach(idx => {
      if (configMode === 'level') {
        const val = parseFloat(spotInputs[idx]);
        if (!isNaN(val)) updateSpotLevel(idx, val);
      } else {
        const prev = PREV_CLOSES[idx] || 1000;
        const pct = parseFloat(pctInputs[idx]);
        if (!isNaN(pct)) {
          const newSpot = prev * (1 + (pct / 100));
          updateSpotLevel(idx, newSpot);
        }
      }
    });
    setShowConfigModal(false);
  };

  const allIndices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY', ...customIndices.map(i => i.name)];

  // Only show bottom navigation on main tabs
  const showBottomNav = !['optionChain', 'tradeSheet'].includes(currentView);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">

      {/* Global CSS to permanently hide number input spinners */}
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* --- MAIN SCREENS --- */}
      {currentView === 'dashboard' && (
        <Dashboard
          onNavigateToTrade={() => setCurrentView('optionChain')}
          onNavigateToPositions={() => setCurrentView('positions')}
          onNavigateToAnalytics={() => setCurrentView('analytics')}
          onNavigateToMore={() => setCurrentView('more')}
          onSelectIndex={(market) => {
            setSelectedMarket(market);
            setCurrentView('optionChain');
          }}
          onOpenConfig={() => setShowConfigModal(true)}
        />
      )}

      {currentView === 'positions' && <Positions onBack={() => setCurrentView('dashboard')} />}

      {currentView === 'analytics' && <Analytics onBack={() => setCurrentView('dashboard')} />}

      {currentView === 'more' && (
        <More
          onNavigateToHome={() => setCurrentView('dashboard')}
          onNavigateToPositions={() => setCurrentView('positions')}
          onNavigateToTrade={() => setCurrentView('optionChain')}
          onNavigateToAnalytics={() => setCurrentView('analytics')}
        />
      )}

      {currentView === 'optionChain' && (
        <OptionChain
          initialMarket={selectedMarket}
          onBack={() => setCurrentView('dashboard')}
          onOpenConfig={() => setShowConfigModal(true)}
          onSelectOption={(tradeData) => {
            setActiveTrade(tradeData);
            setCurrentView('tradeSheet');
          }}
        />
      )}

      {currentView === 'tradeSheet' && activeTrade && (
        <TradeScreen
          optionData={activeTrade}
          onBack={() => setCurrentView('optionChain')}
          onOpenConfig={() => setShowConfigModal(true)}
          onTradeExecute={() => setCurrentView('positions')}
        />
      )}

      {/* --- GLOBAL BOTTOM NAVIGATION --- */}
      {showBottomNav && (
        <nav className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full sm:max-w-md bg-[#141824] border-t border-[#252b3d] flex justify-around items-center h-[72px] pb-safe z-[60]">
          <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${currentView === 'dashboard' ? 'text-[#00D9B5]' : 'text-[#828b9d] hover:text-white'}`}>
            <Home className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={() => setCurrentView('positions')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${currentView === 'positions' ? 'text-[#00D9B5]' : 'text-[#828b9d] hover:text-white'}`}>
            <Briefcase className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">Positions</span>
          </button>
          <button onClick={() => { setSelectedMarket('NIFTY'); setCurrentView('optionChain'); }} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${currentView === 'optionChain' ? 'text-[#00D9B5]' : 'text-[#828b9d] hover:text-white'}`}>
            <ArrowLeftRight className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">Trade</span>
          </button>
          <button onClick={() => setCurrentView('analytics')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${currentView === 'analytics' ? 'text-[#00D9B5]' : 'text-[#828b9d] hover:text-white'}`}>
            <BarChart2 className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">Analytics</span>
          </button>
          <button onClick={() => setCurrentView('more')} className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${currentView === 'more' ? 'text-[#00D9B5]' : 'text-[#828b9d] hover:text-white'}`}>
            <MoreHorizontal className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">More</span>
          </button>
        </nav>
      )}

      {/* --- GLOBAL CONFIG MODAL --- */}
      {showConfigModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-[#181c2a] border border-[#252b3d] w-full max-w-sm rounded-3xl p-5 shadow-2xl relative animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-5 mt-1">
              <h2 className="text-lg font-bold text-white tracking-wide">Update Index Levels</h2>
              <button onClick={() => setShowConfigModal(false)} className="p-1.5 rounded-xl bg-[#10141a] border border-[#252b3d] text-[#828b9d] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Smart Toggle Button */}
            <div className="flex bg-[#10141a] border border-[#252b3d] rounded-xl p-1 mb-5 relative">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#00D9B5] transition-transform duration-300 ${configMode === 'percent' ? 'translate-x-full' : 'translate-x-0'}`} />
              <button onClick={() => setConfigMode('level')} className={`flex-1 z-10 py-2.5 font-mono text-xs font-bold transition-colors ${configMode === 'level' ? 'text-[#06110E]' : 'text-[#828b9d]'}`}>
                Exact Level
              </button>
              <button onClick={() => setConfigMode('percent')} className={`flex-1 z-10 py-2.5 font-mono text-xs font-bold transition-colors ${configMode === 'percent' ? 'text-[#06110E]' : 'text-[#828b9d]'}`}>
                Percentage (%)
              </button>
            </div>

            <div className="space-y-3 mb-5 max-h-[45vh] overflow-y-auto pr-1">
              {allIndices.map((idxName) => {
                const prevClose = PREV_CLOSES[idxName] || 1000;

                return (
                  <div key={idxName} className="bg-[#10141a] border border-[#252b3d] rounded-2xl p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[13px] font-bold text-white tracking-wide">{idxName}</div>
                      <div className="text-[10px] text-[#828b9d] font-mono mt-1">Prev: {prevClose.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="w-36">
                      {configMode === 'level' ? (
                        <input
                          type="number"
                          value={spotInputs[idxName] || ''}
                          onChange={(e) => handleSpotChange(idxName, e.target.value)}
                          placeholder="0"
                          className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl px-3 py-2.5 text-white font-mono text-sm font-bold outline-none focus:border-[#00D9B5] text-right"
                        />
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            value={pctInputs[idxName] || ''}
                            onChange={(e) => handlePctChange(idxName, e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl pr-7 pl-3 py-2.5 text-white font-mono text-sm font-bold outline-none focus:border-[#00D9B5] text-right"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#828b9d] font-bold text-[11px]">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <button onClick={handleSaveModal} className="w-full py-3.5 bg-[#00D9B5] hover:bg-[#00c4a3] text-[#06110E] rounded-2xl font-mono font-bold text-xs tracking-wider transition shadow-lg">
              APPLY CHANGES
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
