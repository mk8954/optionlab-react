import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import OptionChain from './components/OptionChain';
import TradeScreen from './components/TradeScreen';

function App() {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  // Data States
  const [selectedMarket, setSelectedMarket] = useState('NIFTY');
  const [selectedOption, setSelectedOption] = useState(null);

  // Global Centralized Market Parameters (Shared between Dashboard and OptionChain)
  const [marketParams, setMarketParams] = useState({
    NIFTY: { price: '24358.15', expiry: '2026-08-04' },
    BANKNIFTY: { price: '52945.00', expiry: '2026-08-05' },
    FINNIFTY: { price: '23800.00', expiry: '2026-08-03' },
    SENSEX: { price: '77627.50', expiry: '2026-08-06' }
  });

  // Receives changes from Dashboard settings and updates globally
  const handleUpdateParams = (newParams) => {
    setMarketParams({
      NIFTY: { price: newParams.values.NIFTY, expiry: newParams.expiries.NIFTY },
      BANKNIFTY: { price: newParams.values.BANKNIFTY, expiry: newParams.expiries.BANKNIFTY },
      FINNIFTY: { price: newParams.values.FINNIFTY, expiry: newParams.expiries.FINNIFTY },
      SENSEX: { price: newParams.values.SENSEX, expiry: newParams.expiries.SENSEX }
    });
  };

  // Navigate to Option Chain and pre-select the tapped market
  const navigateToOptionChain = (market = 'NIFTY') => {
    setSelectedMarket(market);
    setCurrentScreen('optionChain');
  };

  // Navigate to Trade Screen and pass the exact option contract clicked
  const handleSelectOption = (optionData) => {
    setSelectedOption(optionData);
    setCurrentScreen('trade');
  };

  return (
    <div className="bg-[#141824] min-h-screen">

      {/* 1. DASHBOARD */}
      {currentScreen === 'dashboard' && (
        <Dashboard
          onNavigateToTrade={() => navigateToOptionChain(selectedMarket)}
          onNavigateToPositions={() => alert("Positions page coming next!")}
          onSelectIndex={navigateToOptionChain}
          marketParameters={marketParams}
          onUpdateParameters={handleUpdateParams}
        />
      )}

      {/* 2. OPTION CHAIN */}
      {currentScreen === 'optionChain' && (
        <OptionChain
          onBack={() => setCurrentScreen('dashboard')}
          initialMarket={selectedMarket}
          marketParameters={marketParams}
          onSelectOption={handleSelectOption}
        />
      )}

      {/* 3. TRADE SCREEN */}
      {currentScreen === 'trade' && (
        <TradeScreen
          onBack={() => setCurrentScreen('optionChain')}
          optionData={selectedOption}
        />
      )}

    </div>
  );
}

export default App;
