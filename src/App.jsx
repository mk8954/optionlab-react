import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import OptionChain from './components/OptionChain';
import TradeScreen from './components/TradeScreen';
import Positions from './components/Positions';
import Analytics from './components/Analytics';
import useStore from './store/useStore';
import { X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMarket, setSelectedMarket] = useState('NIFTY');
  const [activeTrade, setActiveTrade] = useState(null);

  // Global Config Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMode, setConfigMode] = useState('values');

  // Connect to Zustand Store
  const spotLevels = useStore((state) => state.settings.spotLevels);
  const selectedExpiries = useStore((state) => state.settings.selectedExpiries);
  const generatedExpiries = useStore((state) => state.settings.generatedExpiries);
  const updateSpotLevel = useStore((state) => state.updateSpotLevel);
  const setManualExpiry = useStore((state) => state.setManualExpiry);

  // Local state for modal form
  const [formValues, setFormValues] = useState(spotLevels);
  const [formExpiries, setFormExpiries] = useState({
    NIFTY: selectedExpiries.NIFTY || generatedExpiries.NIFTY[0],
    BANKNIFTY: selectedExpiries.BANKNIFTY || generatedExpiries.BANKNIFTY[0],
    FINNIFTY: selectedExpiries.FINNIFTY || generatedExpiries.FINNIFTY[0],
    SENSEX: selectedExpiries.SENSEX || generatedExpiries.SENSEX[0],
  });

  // Sync modal form whenever store changes or modal opens
  useEffect(() => {
    setFormValues(spotLevels);
    setFormExpiries({
      NIFTY: selectedExpiries.NIFTY || generatedExpiries.NIFTY[0],
      BANKNIFTY: selectedExpiries.BANKNIFTY || generatedExpiries.BANKNIFTY[0],
      FINNIFTY: selectedExpiries.FINNIFTY || generatedExpiries.FINNIFTY[0],
      SENSEX: selectedExpiries.SENSEX || generatedExpiries.SENSEX[0],
    });
  }, [spotLevels, selectedExpiries, generatedExpiries, showConfigModal]);

  const handleSaveModal = () => {
    // Write changes permanently to Zustand Store (and localStorage)
    Object.keys(formValues).forEach(key => updateSpotLevel(key, parseFloat(formValues[key])));
    Object.keys(formExpiries).forEach(key => setManualExpiry(key, formExpiries[key]));
    setShowConfigModal(false);
  };

  return (
    <div className="w-full h-screen bg-black relative">

      {/* Route: Dashboard */}
      {currentView === 'dashboard' && (
        <Dashboard
          onNavigateToTrade={() => setCurrentView('optionChain')}
          onNavigateToPositions={() => setCurrentView('positions')}
          onNavigateToAnalytics={() => setCurrentView('analytics')}
          onSelectIndex={(market) => {
            setSelectedMarket(market);
            setCurrentView('optionChain');
          }}
          onOpenConfig={() => setShowConfigModal(true)}
        />
      )}

      {/* Route: Positions Tab */}
      {currentView === 'positions' && (
        <Positions
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Route: Analytics Tab */}
      {currentView === 'analytics' && (
        <Analytics
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* Route: Option Chain */}
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

      {/* Route: Trade Screen */}
      {currentView === 'tradeSheet' && activeTrade && (
        <TradeScreen
          optionData={activeTrade}
          onBack={() => setCurrentView('optionChain')}
          onOpenConfig={() => setShowConfigModal(true)}
          onTradeExecute={() => setCurrentView('positions')}
        />
      )}

      {/* Global Config Modal (Rendered on top of everything) */}
      {showConfigModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181c2a] border border-[#252b3d] w-full max-w-sm rounded-3xl p-5 shadow-2xl relative animate-in fade-in duration-200">

            <div className="flex justify-between items-center mb-5 mt-1">
              <h2 className="text-lg font-bold text-white tracking-wide">Simulation Parameters</h2>
              <button onClick={() => setShowConfigModal(false)} className="p-1.5 rounded-xl bg-[#10141a] border border-[#252b3d] text-[#828b9d] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className={"flex bg-[#10141a] border border-[#252b3d] rounded-xl p-1 mb-5 relative " + (configMode === 'expiry' ? 'expiry' : '')}>
              <div className={"absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-280 " + (configMode === 'expiry' ? 'translate-x-full bg-[#FFB020]' : 'translate-x-0 bg-[#00D9B5]')} />
              <button onClick={() => setConfigMode('values')} className={"flex-1 z-10 py-2 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors " + (configMode === 'values' ? 'text-[#0B0E11]' : 'text-[#828b9d]')}>
                <span className="w-1.5 h-1.5 rounded-full bg-currentColor opacity-60" />
                <span>Spot Values</span>
              </button>
              <button onClick={() => setConfigMode('expiry')} className={"flex-1 z-10 py-2 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors " + (configMode === 'expiry' ? 'text-[#1A1200]' : 'text-[#828b9d]')}>
                <span className="w-1.5 h-1.5 rounded-full bg-currentColor opacity-60" />
                <span>Expiry Dates</span>
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map((idxName) => (
                <div key={idxName} className="bg-[#10141a] border border-[#252b3d] rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-white tracking-wide">{idxName}</div>
                    <div className="text-[10px] text-[#828b9d] font-mono mt-0.5">{idxName === 'SENSEX' ? 'BSE Index' : 'NSE Index'}</div>
                  </div>
                  <div className="w-44">
                    {configMode === 'values' ? (
                      <input
                        type="number" value={formValues[idxName]} onChange={(e) => setFormValues({...formValues, [idxName]: e.target.value})}
                        className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl px-3 py-2 text-white font-mono text-sm font-bold outline-none focus:border-[#00D9B5] text-right"
                      />
                    ) : (
                      <input
                        type="date" value={formExpiries[idxName]} onChange={(e) => setFormExpiries({...formExpiries, [idxName]: e.target.value})}
                        className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl px-3 py-2 text-[#FFB020] font-mono text-xs font-bold outline-none focus:border-[#FFB020] cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveModal} className={"w-full py-3.5 rounded-2xl font-mono font-bold text-xs tracking-wider transition shadow-lg " + (configMode === 'expiry' ? 'bg-[#FFB020] text-[#1A1200] hover:bg-[#f5a714]' : 'bg-[#00D9B5] text-[#06110E] hover:bg-[#00c4a3]')}>
              {configMode === 'expiry' ? 'APPLY EXPIRY DATES' : 'APPLY SPOT VALUES'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
