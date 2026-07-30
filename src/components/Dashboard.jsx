import React, { useState } from 'react';
import { Settings2, Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal, Lightbulb, ChevronRight, Eye, EyeOff, ArrowUp, ArrowDown, X } from 'lucide-react';
import AppLogo from '../assets/logo.png';

export default function Dashboard({ onNavigateToTrade, onNavigateToPositions, onSelectIndex, marketParameters, onUpdateParameters }) {
  const [availableCash, setAvailableCash] = useState(814570);
  const [usedMargin, setUsedMargin] = useState(185430);

  const [hideBalance, setHideBalance] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('NIFTY');

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configMode, setConfigMode] = useState('values');

  // Exact Expiry Calculation Function
  const calculateDefaultExpiries = () => {
    const today = new Date('2026-07-30');

    const getNextWeekday = (fromDate, targetDay) => {
      const d = new Date(fromDate);
      let day = d.getDay();
      let diff = (targetDay + 7 - day) % 7;
      if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
      return d.toISOString().split('T')[0];
    };

    const getLastTuesdayOfMonth = (fromDate) => {
      const year = fromDate.getFullYear();
      const month = fromDate.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      let day = lastDay.getDay();
      let diff = (day - 2 + 7) % 7;
      lastDay.setDate(lastDay.getDate() - diff);
      if (lastDay < fromDate) {
        const nextMonthLastDay = new Date(year, month + 2, 0);
        let nDay = nextMonthLastDay.getDay();
        let nDiff = (nDay - 2 + 7) % 7;
        nextMonthLastDay.setDate(nextMonthLastDay.getDate() - nDiff);
        return nextMonthLastDay.toISOString().split('T')[0];
      }
      return lastDay.toISOString().split('T')[0];
    };

    return {
      NIFTY: getNextWeekday(today, 2),        // Tuesday
      SENSEX: getNextWeekday(today, 4),       // Thursday
      BANKNIFTY: getLastTuesdayOfMonth(today), // Last Tuesday of month
      FINNIFTY: getLastTuesdayOfMonth(today)  // Last Tuesday of month
    };
  };

  const calculatedExpiries = calculateDefaultExpiries();

  const [formValues, setFormValues] = useState({
    NIFTY: marketParameters?.NIFTY?.price || '24358.15',
    BANKNIFTY: marketParameters?.BANKNIFTY?.price || '52945.00',
    FINNIFTY: marketParameters?.FINNIFTY?.price || '23800.00',
    SENSEX: marketParameters?.SENSEX?.price || '77627.50'
  });

  const [formExpiries, setFormExpiries] = useState({
    NIFTY: marketParameters?.NIFTY?.expiry || calculatedExpiries.NIFTY,
    BANKNIFTY: marketParameters?.BANKNIFTY?.expiry || calculatedExpiries.BANKNIFTY,
    FINNIFTY: marketParameters?.FINNIFTY?.expiry || calculatedExpiries.FINNIFTY,
    SENSEX: marketParameters?.SENSEX?.expiry || calculatedExpiries.SENSEX
  });

  const PREV_CLOSES = {
    NIFTY: 24105.35,
    BANKNIFTY: 53057.80,
    FINNIFTY: 23754.80,
    SENSEX: 76765.84
  };

  const formatExpiryDisplay = (dateString) => {
    if (!dateString) return 'Tue';
    const targetDate = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(targetDate.getDate()).padStart(2, '0')} ${months[targetDate.getMonth()]}`;
  };

  const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map(name => {
    const currentVal = parseFloat(formValues[name]) || 0;
    const prevClose = PREV_CLOSES[name];
    const pointChange = currentVal - prevClose;
    const pctChange = (pointChange / prevClose) * 100;

    return {
      name: name,
      val: currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: Math.abs(pointChange).toFixed(2),
      pct: Math.abs(pctChange).toFixed(2),
      isDown: pointChange < 0,
      expiryRaw: (marketParameters && marketParameters[name]?.expiry) || formExpiries[name]
    };
  });

  const positions = [
    { id: 1, symbol: 'NIFTY', strike: 24150, type: 'CE', qty: 25, ltp: 139.45, pnl: 1250, pnlPct: 12.45 },
    { id: 2, symbol: 'BANKNIFTY', strike: 56000, type: 'PE', qty: 15, ltp: 210.10, pnl: -770, pnlPct: -6.12 }
  ];

  const handleMarketClick = (marketName) => {
    setSelectedMarket(marketName);
    if (onSelectIndex) {
      onSelectIndex(marketName);
    }
  };

  const handleSaveModal = () => {
    if (onUpdateParameters) {
      onUpdateParameters({ values: formValues, expiries: formExpiries });
    }
    setShowConfigModal(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === 'modal-backdrop') {
      setShowConfigModal(false);
    }
  };

  const formatMoney = (amount) => {
    if (hideBalance) return "••••••";
    return "₹" + amount.toLocaleString('en-IN');
  };

  return (
    <>
      <style>{"\n        .hide-scrollbar::-webkit-scrollbar { display: none; }\n        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }\n        input[type=\"number\"]::-webkit-inner-spin-button,\n        input[type=\"number\"]::-webkit-outer-spin-button {\n          -webkit-appearance: none;\n          margin: 0;\n        }\n        input[type=\"number\"] {\n          -moz-appearance: textfield;\n        }\n      "}</style>

      <div className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#E8EAED] font-sans relative overflow-hidden">

        <header className="px-5 py-4 flex items-center justify-between bg-[#141824] shrink-0 z-20">
          <div>
            <div className="flex items-center space-x-2">
              <img
                src={AppLogo}
                alt="OL"
                className="w-7 h-7 rounded-lg shadow object-cover bg-[#181c2a]"
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div className="w-7 h-7 bg-[#00D9B5] rounded-lg hidden items-center justify-center font-black text-[#0B0E11] text-xs shadow">OL</div>

              <h1 className="text-white font-bold text-xl tracking-wide">
                Option<span className="text-[#00D9B5]">Lab</span>
              </h1>
            </div>
          </div>

          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 bg-[#181c2a] border border-[#252b3d] rounded-lg text-[#828b9d] hover:text-[#00D9B5] transition-colors focus:outline-none"
            title="Simulation Parameters"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable content area with padding bottom so it doesn't get hidden behind the fixed navbar */}
        <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">

          <div className="px-4 pt-1 mb-6">
            <div className="bg-gradient-to-br from-[#1b202e] to-[#151925] border border-[#252b3d] rounded-2xl p-5 shadow-lg relative overflow-hidden">

              <div className="mb-1">
                <p className="text-[#828b9d] text-xs font-semibold tracking-wide">Available Cash</p>
                <div className="flex items-center space-x-3 mt-1.5">
                  <h2 className="text-[32px] font-bold text-white tracking-tight">{formatMoney(availableCash)}</h2>
                  <button onClick={() => setHideBalance(!hideBalance)} className="text-[#828b9d] hover:text-white transition-colors focus:outline-none">
                    {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center text-[#00D9B5] text-[13px] font-semibold mb-6">
                <ArrowUp className="w-3.5 h-3.5 mr-1" />
                Overall Gain +₹45,320 (+5.56%)
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-[#31384e]">
                <div>
                  <p className="text-[#828b9d] text-[11px] font-semibold tracking-wide mb-1">Invested Value</p>
                  <p className="text-white font-bold text-[15px]">{formatMoney(usedMargin)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#828b9d] text-[11px] font-semibold tracking-wide mb-1 flex items-center justify-end">
                    <ArrowUp className="w-3 h-3 mr-1 text-[#00D9B5]" /> Today's Gain
                  </p>
                  <p className="text-[#00D9B5] font-bold text-[15px]">
                    +₹2,450 <span className="font-semibold text-xs ml-0.5">(+0.25%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mb-6">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-[14px] font-bold text-gray-200">Markets Today</h3>
            </div>

            <div className="flex space-x-3.5 overflow-x-auto hide-scrollbar pb-2">
              {indices.map((idx) => {
                const isSelected = selectedMarket === idx.name;
                const displayExpiry = formatExpiryDisplay(idx.expiryRaw);
                return (
                  <button
                    key={idx.name}
                    onClick={() => handleMarketClick(idx.name)}
                    className={"bg-[#181c2a] border rounded-2xl p-4 min-w-[190px] shrink-0 flex flex-col text-left transition-all focus:outline-none shadow-sm " + (isSelected ? "border-[#00D9B5] ring-1 ring-[#00D9B5]/30" : "border-[#252b3d] hover:border-[#00D9B5]/50")}
                  >
                    <div className="flex justify-between items-center mb-2.5">
                      <h4 className="text-sm font-bold text-white tracking-wide">{idx.name}</h4>
                      <div className={"text-[13px] font-bold flex items-center " + (idx.isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {idx.val}
                        {idx.isDown ? <ArrowDown className="w-3.5 h-3.5 ml-0.5" strokeWidth={2.5} /> : <ArrowUp className="w-3.5 h-3.5 ml-0.5" strokeWidth={2.5} />}
                      </div>
                    </div>

                    <div className="flex justify-between items-center w-full mt-1">
                      <span className="bg-[#10141a] border border-[#252b3d] text-[#828b9d] text-[10px] px-2 py-0.5 rounded font-semibold">Exp {displayExpiry}</span>
                      <span className={"text-[11px] font-semibold " + (idx.isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                        {idx.isDown ? "-" : "+"}{idx.change} ({idx.isDown ? "-" : "+"}{idx.pct}%)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-6">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-[14px] font-bold text-gray-200">Open Positions</h3>
                <span className="text-[11px] font-bold text-[#828b9d] bg-[#181c2a] border border-[#252b3d] px-2 py-0.5 rounded font-mono">2</span>
              </div>
              <button onClick={onNavigateToPositions} className="flex items-center text-xs font-bold text-[#00D9B5] hover:underline focus:outline-none">
                VIEW ALL <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            <div className="space-y-3">
              {positions.map(pos => {
                const isProfit = pos.pnl >= 0;
                return (
                  <button
                    key={pos.id}
                    onClick={() => {
                      if (onNavigateToPositions) {
                        onNavigateToPositions(pos.id);
                      }
                    }}
                    className="w-full bg-[#181c2a] border border-[#252b3d] rounded-2xl p-4 flex justify-between items-center hover:bg-[#1d2232] transition-colors focus:outline-none text-left shadow-sm"
                  >
                    <div>
                      <h4 className="text-[14px] font-bold text-white mb-1">{pos.symbol} {pos.strike} {pos.type}</h4>
                      <p className="text-xs text-[#828b9d] font-semibold">Qty {pos.qty} <span className="mx-2 text-[#252b3d]">|</span> LTP {pos.ltp.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <div className={"text-[14px] font-bold mb-0.5 " + (isProfit ? "text-[#00D9B5]" : "text-[#FF5C5C]")}>{isProfit ? "+" : ""}₹{Math.abs(pos.pnl).toLocaleString('en-IN')}</div>
                      <div className={"text-xs font-semibold " + (isProfit ? "text-[#00D9B5]" : "text-[#FF5C5C]")}>{isProfit ? "+" : ""}{pos.pnlPct}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-4">
            <h3 className="text-[14px] font-bold text-gray-200 mb-3">Today's Insight</h3>
            <div className="bg-[#181c2a] border border-[#252b3d] rounded-2xl p-4 flex items-start space-x-3.5 shadow-sm">
              <div className="bg-[#10141a] p-2.5 rounded-xl border border-[#252b3d] shrink-0">
                <Lightbulb className="w-5 h-5 text-[#FFB020]" />
              </div>
              <p className="text-[12px] text-[#828b9d] leading-relaxed font-medium pt-0.5">
                Your last 5 losing trades were entered after <span className="text-gray-300 font-bold">2:00 PM</span>. Try focusing on morning setups to improve your win rate.
              </p>
            </div>
          </div>
        </div>

        {showConfigModal && (
          <div id="modal-backdrop" onClick={handleBackdropClick} className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181c2a] border border-[#252b3d] w-full max-w-sm rounded-3xl p-5 shadow-2xl relative animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto hide-scrollbar" onClick={(e) => e.stopPropagation()}>

              <div className="flex justify-between items-center mb-5 mt-1">
                <h2 className="text-lg font-bold text-white tracking-wide">Simulation Parameters</h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-1.5 rounded-xl bg-[#10141a] border border-[#252b3d] text-[#828b9d] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={"flex bg-[#10141a] border border-[#252b3d] rounded-xl p-1 mb-5 relative " + (configMode === 'expiry' ? 'expiry' : '')}>
                <div className={"absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-all duration-280 " + (configMode === 'expiry' ? 'translate-x-full bg-[#FFB020]' : 'translate-x-0 bg-[#00D9B5]')} />

                <button
                  onClick={() => setConfigMode('values')}
                  className={"flex-1 z-10 py-2 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors " + (configMode === 'values' ? 'text-[#0B0E11]' : 'text-[#828b9d]')}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-currentColor opacity-60" />
                  <span>Spot Values</span>
                </button>

                <button
                  onClick={() => setConfigMode('expiry')}
                  className={"flex-1 z-10 py-2 font-mono text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors " + (configMode === 'expiry' ? 'text-[#1A1200]' : 'text-[#828b9d]')}
                >
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
                          type="number"
                          value={formValues[idxName]}
                          onChange={(e) => setFormValues({...formValues, [idxName]: e.target.value})}
                          className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl px-3 py-2 text-white font-mono text-sm font-bold outline-none focus:border-[#00D9B5] text-right"
                        />
                      ) : (
                        <div className="relative">
                          <input
                            type="date"
                            value={formExpiries[idxName]}
                            onChange={(e) => setFormExpiries({...formExpiries, [idxName]: e.target.value})}
                            className="w-full bg-[#181c2a] border border-[#252b3d] rounded-xl px-3 py-2 text-[#FFB020] font-mono text-xs font-bold outline-none focus:border-[#FFB020] cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveModal}
                className={"w-full py-3.5 rounded-2xl font-mono font-bold text-xs tracking-wider transition shadow-lg " + (configMode === 'expiry' ? 'bg-[#FFB020] text-[#1A1200] hover:bg-[#f5a714]' : 'bg-[#00D9B5] text-[#06110E] hover:bg-[#00c4a3]')}
              >
                {configMode === 'expiry' ? 'APPLY EXPIRY DATES' : 'APPLY SPOT VALUES'}
              </button>

              <div className="text-center font-mono text-[10px] text-[#828b9d] mt-3 mb-1">
                {configMode === 'expiry' ? 'Editing expiry dates · tap Spot Values to switch' : 'Editing spot values · tap Expiry Dates to switch'}
              </div>

            </div>
          </div>
        )}

        {/* FIXED BOTTOM TASKBAR (Locked permanently, never scrolls) */}
        <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#141824] border-t border-[#252b3d] flex justify-around items-center h-[72px] pb-safe z-40">
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#00D9B5] focus:outline-none">
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={onNavigateToPositions} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <Briefcase className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Positions</span>
          </button>
          <button onClick={onNavigateToTrade} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <ArrowLeftRight className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Trade</span>
          </button>
          <button onClick={() => alert("Analytics tab coming up next!")} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <BarChart2 className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Analytics</span>
          </button>
          <button onClick={() => alert("Profile & Ledger tab coming up next!")} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>

      </div>
    </>
  );
}
