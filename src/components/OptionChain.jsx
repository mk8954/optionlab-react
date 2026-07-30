import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function OptionChain({ onBack, initialMarket = 'NIFTY', marketParameters, onSelectOption, onOpenConfig }) {
  const [market, setMarket] = useState(initialMarket);

  // Helper to calculate upcoming expiries based on rules
  const getUpcomingExpiries = (marketName) => {
    const today = new Date('2026-07-30');
    const expiries = [];

    let targetDay = 2; // Tuesday for Nifty, BankNifty, Finnifty
    if (marketName === 'SENSEX') targetDay = 4; // Thursday for Sensex

    let d = new Date(today);
    let day = d.getDay();
    let diff = (targetDay + 7 - day) % 7;
    if (diff === 0) diff = 7;
    d.setDate(d.getDate() + diff);

    // Generate next 5 expiries
    for (let i = 0; i < 5; i++) {
      const expDate = new Date(d);
      if (marketName === 'BANKNIFTY' || marketName === 'FINNIFTY') {
        // Last Tuesday of the month rule
        const year = expDate.getFullYear();
        const month = expDate.getMonth() + i;
        const lastDay = new Date(year, month + 1, 0);
        let lDay = lastDay.getDay();
        let lDiff = (lDay - 2 + 7) % 7;
        lastDay.setDate(lastDay.getDate() - lDiff);
        expDate.setTime(lastDay.getTime());
      } else {
        expDate.setDate(d.getDate() + (i * 7));
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formatted = `${String(expDate.getDate()).padStart(2, '0')} ${months[expDate.getMonth()]}`;
      expiries.push(formatted);
    }
    return expiries;
  };

  const defaultParams = {
    NIFTY: { price: 24358.15, change: 252.80, pct: 1.05 },
    BANKNIFTY: { price: 52945.00, change: -112.80, pct: -0.21 },
    FINNIFTY: { price: 23800.00, change: 45.20, pct: 0.18 },
    SENSEX: { price: 77627.50, change: 861.66, pct: 1.12 }
  };

  const availableExpiries = getUpcomingExpiries(market);
  const [selectedExpiry, setSelectedExpiry] = useState(availableExpiries[0]);

  // Update expiry list when market changes
  useEffect(() => {
    const newExps = getUpcomingExpiries(market);
    setSelectedExpiry(newExps[0]);
  }, [market]);

  useEffect(() => {
    setMarket(initialMarket);
  }, [initialMarket]);

  const marketData = {
    ...defaultParams[market],
    ...(marketParameters && marketParameters[market] ? marketParameters[market] : {})
  };

  const currentSpot = parseFloat(marketData.price);
  const spotLevelRef = useRef(null);

  // Long press timer ref for opening simulator config
  const pressTimer = useRef(null);
  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => {
      if (onOpenConfig) onOpenConfig();
    }, 800);
  };
  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  // Swipe-to-go-back gesture
  const [touchStartPos, setTouchStartPos] = useState(null);
  const handleGestureStart = (e) => setTouchStartPos(e.targetTouches[0].clientX);
  const handleGestureEnd = (e) => {
    if (!touchStartPos) return;
    const distance = touchStartPos - e.changedTouches[0].clientX;
    if (distance < -75) onBack();
  };

  const strikeStep = (market === 'BANKNIFTY' || market === 'SENSEX') ? 100 : 50;
  const baseStrike = Math.round(currentSpot / strikeStep) * strikeStep;
  const strikes = [];

  for (let i = -20; i <= 20; i++) {
    const strike = baseStrike + (i * strikeStep);
    const rawDistance = strike - currentSpot;
    strikes.push({ strike, rawDistance });
  }

  useEffect(() => {
    if (spotLevelRef.current) {
      spotLevelRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [market]);

  const handleOptionClick = (type, strikeData, distanceStr) => {
    if (onSelectOption) {
      onSelectOption({
        market: market,
        expiry: selectedExpiry,
        strike: strikeData.strike,
        type: type,
        price: distanceStr,
        isItm: type === 'CE' ? strikeData.strike < currentSpot : strikeData.strike > currentSpot
      });
    }
  };

  const formatMoney = (val) => val.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  return (
    <>
      <style>{"\n        .hide-scrollbar::-webkit-scrollbar { display: none; }\n        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }\n      "}</style>

      <div
        className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#E8EAED] font-sans relative"
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
      >

        {/* FIXED STICKY TOP CONTAINER */}
        <div className="sticky top-0 z-30 bg-[#141824] shadow-md">

          {/* Top Header - Scrollable Market Cards */}
          <div className="flex items-center pt-3 pb-3 pl-3 border-b border-[#252b3d] shrink-0">
            <button onClick={onBack} className="p-2 mr-1 text-[#828b9d] hover:text-white transition-colors">
              <ArrowLeft size={22} />
            </button>

            <div className="flex space-x-3 overflow-x-auto hide-scrollbar pr-4 pb-1">
              {Object.keys(defaultParams).map(idx => {
                const data = { ...defaultParams[idx], ...(marketParameters && marketParameters[idx] ? marketParameters[idx] : {}) };
                const isSelected = market === idx;
                const isDown = data.change < 0;

                return (
                  <button
                    key={idx}
                    onClick={() => setMarket(idx)}
                    className={"p-2.5 rounded-xl min-w-[175px] text-left transition-all border shrink-0 " + (isSelected ? "border-[#404c73] bg-[#1a2033]" : "border-transparent hover:bg-[#181c2a]")}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-bold text-[#e2e5eb] tracking-wide">{idx}</span>
                      <span className="text-[9px] bg-[#252b3d] text-[#828b9d] px-1.5 py-0.5 rounded font-semibold tracking-wider">
                        Exp {availableExpiries[0]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className={"text-[13px] font-bold " + (isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {formatMoney(data.price)} {isDown ? "▼" : "▲"}
                      </span>
                      <span className={"text-[10px] font-semibold " + (isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {isDown ? "" : "+"}{data.change}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiry Bar (Auto-calculated options with long-press to config) */}
          <div
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="flex space-x-2 overflow-x-auto hide-scrollbar px-4 py-3 bg-[#141824] border-b border-[#252b3d] shrink-0 select-none"
            title="Long-press any expiry to open configuration"
          >
            {availableExpiries.map(exp => {
              const isSelected = selectedExpiry === exp;
              return (
                <button
                  key={exp}
                  onClick={() => setSelectedExpiry(exp)}
                  className={"px-4 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-colors " + (isSelected ? 'bg-[#00D9B5] text-[#0B0E11] shadow-md shadow-[#00D9B5]/20' : 'border border-[#252b3d] text-[#828b9d] hover:text-white')}
                >
                  {exp}
                </button>
              );
            })}
          </div>

          {/* Option Chain Headers */}
          <div className="flex justify-between px-5 py-2.5 text-[10px] font-bold border-b border-[#252b3d] bg-[#181c2a] uppercase tracking-widest text-[#828b9d] shrink-0">
            <div className="w-[35%]">CALLS</div>
            <div className="w-[30%] text-center">STRIKE</div>
            <div className="w-[35%] text-right">PUTS</div>
          </div>

        </div>

        {/* Option Chain Scrollable Strike List */}
        <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar bg-[#141824]">
          {strikes.map((row) => {
            const showSpotLine = currentSpot >= row.strike && currentSpot < (row.strike + strikeStep);
            const absDistance = Math.abs(row.rawDistance).toFixed(2);

            const ceIsGreen = row.strike < currentSpot;
            const ceColorClass = ceIsGreen ? "text-[#00D9B5]" : "text-[#FF5C5C]";
            const ceBgClass = ceIsGreen ? "bg-[#00D9B5]/10" : "bg-[#FF5C5C]/10";

            const peIsGreen = row.strike > currentSpot;
            const peColorClass = peIsGreen ? "text-[#00D9B5]" : "text-[#FF5C5C]";
            const peBgClass = peIsGreen ? "bg-[#00D9B5]/10" : "bg-[#FF5C5C]/10";

            return (
              <React.Fragment key={row.strike}>

                <div className="flex border-b border-[#1d2232] cursor-pointer hover:bg-[#1a2033] transition-colors">

                  {/* CE Area */}
                  <div
                    onClick={() => handleOptionClick('CE', row, absDistance)}
                    className={"w-[35%] py-3 px-5 flex flex-col justify-center active:bg-white/10 " + ceBgClass}
                  >
                    <div className={"font-mono font-bold text-[15px] " + ceColorClass}>
                      {absDistance}
                    </div>
                  </div>

                  {/* Strike Price */}
                  <div className="w-[30%] py-3 flex items-center justify-center bg-[#181c2a]/40 border-x border-[#1d2232]/50">
                    <span className="font-bold text-[14px] text-[#E8EAED] font-mono tracking-wide">{row.strike}</span>
                  </div>

                  {/* PE Area */}
                  <div
                    onClick={() => handleOptionClick('PE', row, absDistance)}
                    className={"w-[35%] py-3 px-5 flex flex-col justify-center text-right active:bg-white/10 " + peBgClass}
                  >
                    <div className={"font-mono font-bold text-[15px] " + peColorClass}>
                      {absDistance}
                    </div>
                  </div>

                </div>

                {/* Center Spot Line */}
                {showSpotLine && (
                  <div ref={spotLevelRef} className="w-full flex items-center justify-center py-2.5 relative bg-[#141824]">
                    <div className="absolute w-full border-t border-dashed border-[#00D9B5]/40"></div>
                    <div className="bg-[#181c2a] px-4 py-1.5 z-10 text-[14px] font-bold text-white font-mono tracking-wide rounded-full border border-[#252b3d] shadow-sm">
                      {currentSpot.toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </div>
                  </div>
                )}

              </React.Fragment>
            );
          })}
        </div>

      </div>
    </>
  );
}
