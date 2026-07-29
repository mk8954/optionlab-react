import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TradeScreen from './components/TradeScreen';


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');


  return (
    <div className="bg-[#141824] min-h-screen text-white font-sans">
      {currentScreen === 'dashboard' && (
        <Dashboard onNavigateToTrade={() => setCurrentScreen('trade')} />
      )}

      {currentScreen === 'trade' && (
        <TradeScreen onBack={() => setCurrentScreen('dashboard')} />
      )}
    </div>
  );
}

