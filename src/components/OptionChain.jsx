import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import useStore from '../store/useStore';

const PREV_CLOSES = { NIFTY: 24105.35, BANKNIFTY: 53057.80, FINNIFTY: 23754.80, SENSEX: 76765.84 };

// Index specific rules
const INDEXES = {
  NIFTY:      { lotSize: 65, expiry: "Weekly & Monthly (Tuesday)" },
  BANKNIFTY:  { lotSize: 30, expiry: "Monthly (Last Tuesday)" },
  FINNIFTY:   { lotSize: 60, expiry: "Monthly (Last Tuesday)" },
  SENSEX:     { lotSize: 20, expiry: "Weekly & Monthly (Thursday)" },
};

export default function OptionChain({ onBack, initialMarket = 'NIFTY', onSelectOption }) {
  const [market, setMarket] = useState(initialMarket);
  const marketTabRefs = useRef({});
  const spotLevelRef = useRef(null);

  // Connect to Zustand Store SAFELY
  const settings = useStore(state => state.settings) || {};
  const spotLevels = settings.spotLevels || {};
  const generatedExpiries = settings.generatedExpiries || {};
  const selectedExpiries = settings.selectedExpiries || {};
  const setManualExpiry = useStore(state => state.setManualExpiry);

  const currentSpot = spotLevels[market] || 0;

  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [tempDate, setTempDate] = useState("");

  const baseExpiries = generatedExpiries[market] || [];
  const customSelected = selectedExpiries[market];

  const allExpiries = [...new Set([...baseExpiries, customSelected].filter(Boolean))];

  // Sort real Date values chronologically
  const sortedExpiries = allExpiries.sort((a, b) => new Date(a) - new Date(b));

  // Keep track of the active selected pill
  const activeGlobalExpiry = customSelected || sortedExpiries[0];
  const [localSelectedExpiry, setLocalSelectedExpiry] = useState(activeGlobalExpiry);

  // Sync active tab when global config or market changes
  useEffect(() => {
    setLocalSelectedExpiry(selectedExpiries[market] || sortedExpiries[0]);
  }, [market, selectedExpiries, generatedExpiries]);

  // Sync initial market from dashboard click and Auto-scroll
  useEffect(() => {
    setMarket(initialMarket);
    if (marketTabRefs.current[initialMarket]) {
      marketTabRefs.current[initialMarket].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [initialMarket]);

  // Handle Long Press for Single-Index Expiry Modal
  const pressTimer = useRef(null);
  const handleTouchStart = () => {
    pressTimer.current = setTimeout(() => setShowExpiryModal(true), 600);
  };
  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const handleUpdateCustomExpiry = () => {
    if (tempDate) {
      setManualExpiry(market, tempDate);
      setLocalSelectedExpiry(tempDate);
    }
    setShowExpiryModal(false);
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

  // Auto-scroll Option Chain to Center Line
  useEffect(() => {
    if (spotLevelRef.current) {
      spotLevelRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
  }, [market]);

  const handleOptionClick = (type, strikeData, distanceStr) => {
    if (onSelectOption) {
      onSelectOption({
        market: market,
        expiry: localSelectedExpiry,
        strike: strikeData.strike,
        type: type,
        price: distanceStr,
        isItm: type === 'CE' ? strikeData.strike < currentSpot : strikeData.strike > currentSpot
      });
    }
  };

  const formatMoney = (val) => val.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

  // Format ISO (YYYY-MM-DD) for display (DD MMM)
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#E8EAED] font-sans relative"
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
      >

        {/* FIXED STICKY TOP CONTAINER */}
        <div className="sticky top-0 z-30 bg-[#141824] shadow-md">

          {/* Top Header - Auto-scrolling Market Cards */}
          <div className="flex items-center pt-3 pb-3 pl-3 border-b border-[#252b3d] shrink-0">
            <button onClick={onBack} className="p-2 mr-1 text-[#828b9d] hover:text-white transition-colors">
              <ArrowLeft size={22} />
            </button>

            <div className="flex space-x-3 overflow-x-auto hide-scrollbar pr-4 pb-1">
              {['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map(idx => {
                const val = spotLevels[idx] || 0;
                const prev = PREV_CLOSES[idx];
                const change = val - prev;
                const isSelected = market === idx;
                const isDown = change < 0;

                return (
                  <button
                    key={idx}
                    ref={(el) => (marketTabRefs.current[idx] = el)}
                    onClick={() => {
                      setMarket(idx);
                      if (marketTabRefs.current[idx]) {
                        marketTabRefs.current[idx].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                      }
                    }}
                    className={"p-2.5 rounded-xl min-w-[175px] text-left transition-all border shrink-0 focus:outline-none " + (isSelected ? "border-[#404c73] bg-[#1a2033]" : "border-transparent hover:bg-[#181c2a]")}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[13px] font-bold text-[#e2e5eb] tracking-wide">{idx}</span>
                      <span className="text-[9px] bg-[#252b3d] text-[#828b9d] px-1.5 py-0.5 rounded font-semibold tracking-wider">
                        Exp {formatDateLabel(selectedExpiries[idx] || (generatedExpiries[idx] ? generatedExpiries[idx][0] : ''))}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className={"text-[13px] font-bold " + (isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {formatMoney(val)} {isDown ? "▼" : "▲"}
                      </span>
                      <span className={"text-[10px] font-semibold " + (isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {isDown ? "" : "+"}{Math.abs(change).toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Interactive Expiry Bar (Chronological) */}
          <div
            className="flex space-x-2 overflow-x-auto hide-scrollbar px-4 py-3 bg-[#141824] border-b border-[#252b3d] shrink-0 select-none"
            title="Long-press any expiry to open configuration"
          >
            {sortedExpiries.map(exp => {
              const isSelected = localSelectedExpiry === exp;
              return (
                <button
                  key={exp}
                  onMouseDown={handleTouchStart}
                  onMouseUp={handleTouchEnd}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setLocalSelectedExpiry(exp)}
                  className={"px-4 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-colors focus:outline-none " + (isSelected ? 'bg-[#00D9B5] text-[#0B0E11] shadow-md shadow-[#00D9B5]/20' : 'border border-[#252b3d] text-[#828b9d] hover:text-white')}
                >
                  {formatDateLabel(exp)}
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

        {/* SINGLE-INDEX EXPIRY MODAL */}
        {showExpiryModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="bg-[#181c2a] border border-[#252b3d] p-5 rounded-lg w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-white font-bold text-base">Change Expiry</h3>
                <X onClick={() => setShowExpiryModal(false)} className="w-5 h-5 text-[#828b9d] cursor-pointer" />
              </div>

              {/* SAFELY Displaying Index Specific Rules */}
              <p className="text-[#00D9B5] text-[11px] font-semibold mb-5 bg-[#00D9B5]/10 inline-block px-2 py-1 rounded">
                {market} • {(INDEXES[market] && INDEXES[market].expiry) || "Custom Expiry"}
              </p>

              <label className="text-[#828b9d] text-xs font-semibold block mb-2 tracking-wide uppercase">Select Custom Date</label>
              <input
                type="date"
                className="w-full bg-[#0e121b] border border-[#252b3d] text-white p-3 rounded-lg mb-5 focus:outline-none focus:border-[#00D9B5] uppercase text-sm font-medium"
                onChange={(e) => setTempDate(e.target.value)}
              />

              <button
                onClick={handleUpdateCustomExpiry}
                className="w-full py-3.5 bg-[#00D9B5] hover:bg-[#00c4a3] text-[#06110E] rounded-lg font-bold text-sm transition-colors uppercase tracking-wide focus:outline-none"
              >
                Update {market} Expiry
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
