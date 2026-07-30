import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import OptionChain from './components/OptionChain';
import TradeScreen from './components/TradeScreen';
import { Settings2, X } from 'lucide-react';

function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [selectedMarket, setSelectedMarket] = useState('NIFTY');
  const [selectedOption, setSelectedOption] = useState(null);

  // Modal State Moved Here
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMode, setConfigMode] = useState('values');

  const [marketParams, setMarketParams] = useState({
    NIFTY: { price: '24358.15', expiry: '2026-08-04' },
    BANKNIFTY: { price: '52945.00', expiry: '2026-08-25' },
    FINNIFTY: { price: '23800.00', expiry: '2026-08-25' },
    SENSEX: { price: '77627.50', expiry: '2026-08-06' }
  });

  const handleUpdateParams = (newParams) => {
    setMarketParams({
      NIFTY: { price: newParams.values.NIFTY, expiry: newParams.expiries.NIFTY },
      BANKNIFTY: { price: newParams.values.BANKNIFTY, expiry: newParams.expiries.BANKNIFTY },
      FINNIFTY: { price: newParams.values.FINNIFTY, expiry: newParams.expiries.FINNIFTY },
      SENSEX: { price: newParams.values.SENSEX, expiry: newParams.expiries.SENSEX }
    });
  };

  return (
    <div className="bg-[#141824] min-h-screen">

      {currentScreen === 'dashboard' && (
        <Dashboard
          onNavigateToTrade={() => setCurrentScreen('optionChain')}
          onNavigateToPositions={() => alert("Positions page!")}
          onSelectIndex={(m) => { setSelectedMarket(m); setCurrentScreen('optionChain'); }}
          marketParameters={marketParams}
          onOpenConfig={() => setShowConfigModal(true)}
        />
      )}

      {currentScreen === 'optionChain' && (
        <OptionChain
          onBack={() => setCurrentScreen('dashboard')}
          initialMarket={selectedMarket}
          marketParameters={marketParams}
          onSelectOption={(data) => { setSelectedOption(data); setCurrentScreen('trade'); }}
        />
      )}

      {currentScreen === 'trade' && (
        <TradeScreen
          onBack={() => setCurrentScreen('optionChain')}
          optionData={selectedOption}
          marketParameters={marketParams}
          onOpenConfig={() => setShowConfigModal(true)}
        />
      )}

      {/* Global Simulation Modal */}
      {showConfigModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           {/* Modal content from previous dashboard, just reused here.
               (You can move the modal JSX into a separate 'SimulationModal.jsx' file for cleaner code) */}
           <div className="bg-[#181c2a] w-full max-w-sm rounded-3xl p-5 shadow-2xl">
             <div className="flex justify-between items-center mb-5"><h2 className="text-lg font-bold text-white">Parameters</h2><button onClick={() => setShowConfigModal(false)}><X className="text-white"/></button></div>
             {/* Add your Config UI here */}
           </div>
        </div>
      )}
    </div>
  );
}
export default App;
