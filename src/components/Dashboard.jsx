import React, { useState } from 'react';
import { Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal, ChevronRight, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import AppLogo from '../assets/logo.png';
import useStore from '../store/useStore';

const PREV_CLOSES = { NIFTY: 24105.35, BANKNIFTY: 53057.80, FINNIFTY: 23754.80, SENSEX: 76765.84 };

export default function Dashboard({ onNavigateToTrade, onNavigateToPositions, onNavigateToAnalytics, onSelectIndex }) {
  const [hideBalance, setHideBalance] = useState(false);

  // Pull all required data from our central Zustand Store
  const wallet = useStore(state => state.wallet || { availableCash: 0, investedMargin: 0 });
  const openPositions = useStore(state => state.openPositions || []);
  const spotLevels = useStore(state => state.settings?.spotLevels || {});
  const selectedExpiries = useStore(state => state.settings?.selectedExpiries || {});
  const generatedExpiries = useStore(state => state.settings?.generatedExpiries || {});

  const formatExpiryDisplay = (dateString) => {
    if (!dateString) return 'Tue';
    const targetDate = new Date(dateString);
    if (isNaN(targetDate)) return dateString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(targetDate.getDate()).padStart(2, '0')} ${months[targetDate.getMonth()]}`;
  };

  const formatMoney = (amount) => {
    if (hideBalance) return "••••••";
    return "₹" + (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Derive active index data dynamically
  const indices = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'].map(name => {
    const currentVal = spotLevels[name] || 0;
    const prevClose = PREV_CLOSES[name];
    const pointChange = currentVal - prevClose;
    const pctChange = (pointChange / prevClose) * 100;
    const activeExp = selectedExpiries[name] || (generatedExpiries[name] ? generatedExpiries[name][0] : '');

    return {
      name,
      val: currentVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: Math.abs(pointChange).toFixed(2),
      pct: Math.abs(pctChange).toFixed(2),
      isDown: pointChange < 0,
      expiryRaw: activeExp
    };
  });

  const totalPnL = openPositions.reduce((acc, p) => acc + (p.runningPnL || 0), 0);
  const totalPnLPct = wallet.investedMargin > 0 ? (totalPnL / wallet.investedMargin) * 100 : 0;

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#E8EAED] font-sans relative overflow-hidden">

        <header className="px-5 py-4 flex items-center justify-between bg-[#141824] shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <img src={AppLogo} alt="OL" className="w-7 h-7 rounded-lg shadow object-cover bg-[#181c2a]" onError={(e) => { e.target.style.display='none'; }} />
            <div className="w-7 h-7 bg-[#00D9B5] rounded-lg hidden items-center justify-center font-black text-[#0B0E11] text-xs shadow">OL</div>
            <h1 className="text-white font-bold text-xl tracking-wide">Option<span className="text-[#00D9B5]">Lab</span></h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">

          <div className="px-4 pt-1 mb-6">
            <div className="bg-gradient-to-br from-[#1b202e] to-[#151925] border border-[#252b3d] rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="mb-1">
                <p className="text-[#828b9d] text-xs font-semibold tracking-wide">Available Cash</p>
                <div className="flex items-center space-x-3 mt-1.5">
                  <h2 className="text-[32px] font-bold text-white tracking-tight">{formatMoney(wallet.availableCash)}</h2>
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
                  <p className="text-white font-bold text-[15px]">{formatMoney(wallet.investedMargin)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#828b9d] text-[11px] font-semibold tracking-wide mb-1 flex items-center justify-end">
                    {totalPnL >= 0 ? <ArrowUp className="w-3 h-3 mr-1 text-[#00D9B5]" /> : <ArrowDown className="w-3 h-3 mr-1 text-[#FF5C5C]" />} Today's P&L
                  </p>
                  <p className={`font-bold text-[15px] ${totalPnL >= 0 ? 'text-[#00D9B5]' : 'text-[#FF5C5C]'}`}>
                    {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN')} <span className="font-semibold text-xs ml-0.5">({totalPnLPct >= 0 ? '+' : ''}{totalPnLPct.toFixed(2)}%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mb-6">
            <h3 className="text-[14px] font-bold text-gray-200 mb-3">Markets Today</h3>
            <div className="flex space-x-3.5 overflow-x-auto hide-scrollbar pb-2">
              {indices.map((idx) => (
                <button key={idx.name} onClick={() => onSelectIndex(idx.name)} className={"bg-[#181c2a] border rounded-2xl p-4 min-w-[190px] shrink-0 flex flex-col text-left shadow-sm border-[#252b3d] hover:border-[#00D9B5]/50 focus:outline-none"}>
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="text-sm font-bold text-white tracking-wide">{idx.name}</h4>
                    <div className={"text-[13px] font-bold flex items-center " + (idx.isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                      {idx.val} {idx.isDown ? <ArrowDown className="w-3.5 h-3.5 ml-0.5" strokeWidth={2.5} /> : <ArrowUp className="w-3.5 h-3.5 ml-0.5" strokeWidth={2.5} />}
                    </div>
                  </div>
                  <div className="flex justify-between items-center w-full mt-1">
                    <span className="bg-[#10141a] border border-[#252b3d] text-[#828b9d] text-[10px] px-2 py-0.5 rounded font-semibold">Exp {formatExpiryDisplay(idx.expiryRaw)}</span>
                    <span className={"text-[11px] font-semibold " + (idx.isDown ? "text-[#FF5C5C]" : "text-[#00D9B5]")}>
                      {idx.isDown ? "-" : "+"}{idx.change} ({idx.isDown ? "-" : "+"}{idx.pct}%)
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 mb-6">
            <div className="flex justify-between items-end mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-[14px] font-bold text-gray-200">Open Positions</h3>
                <span className="text-[11px] font-bold text-[#828b9d] bg-[#181c2a] border border-[#252b3d] px-2 py-0.5 rounded font-mono">{openPositions.length}</span>
              </div>
              <button onClick={onNavigateToPositions} className="flex items-center text-xs font-bold text-[#00D9B5] focus:outline-none hover:underline">
                VIEW ALL <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            <div className="space-y-3">
              {openPositions.length === 0 ? (
                <div className="bg-[#181c2a] border border-[#252b3d] rounded-2xl p-6 text-center text-[#828b9d] text-xs font-medium">
                  No open positions. Execute trades from the Option Chain.
                </div>
              ) : (
                // REVERSED ARRAY: Latest trades show up at the top
                [...openPositions].reverse().map(pos => {
                  const isProfit = (pos.runningPnL || 0) >= 0;
                  return (
                    <button key={pos.id} onClick={onNavigateToPositions} className="w-full bg-[#181c2a] border border-[#252b3d] rounded-2xl p-4 flex justify-between items-center hover:bg-[#1d2232] text-left focus:outline-none shadow-sm">
                      <div>
                        <h4 className="text-[14px] font-bold text-white mb-1">{pos.symbol} {pos.strike} {pos.type}</h4>
                        <p className="text-xs text-[#828b9d] font-semibold">Qty {pos.qty} <span className="mx-2 text-[#252b3d]">|</span> LTP {(pos.currentPremium || pos.entryPremium || 0).toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <div className={"text-[14px] font-bold mb-0.5 " + (isProfit ? "text-[#00D9B5]" : "text-[#FF5C5C]")}>
                          {isProfit ? "+" : ""}₹{Math.abs(pos.runningPnL || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* FIXED BOTTOM TASKBAR */}
        <nav className="absolute bottom-0 left-0 right-0 w-full bg-[#141824] border-t border-[#252b3d] flex justify-around items-center h-[72px] pb-safe z-40">
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#00D9B5] focus:outline-none">
            <Home className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">Home</span>
          </button>
          <button onClick={onNavigateToPositions} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <Briefcase className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">Positions</span>
          </button>
          <button onClick={onNavigateToTrade} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <ArrowLeftRight className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">Trade</span>
          </button>
          <button onClick={onNavigateToAnalytics} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <BarChart2 className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">Analytics</span>
          </button>
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors focus:outline-none">
            <MoreHorizontal className="w-5 h-5 mb-1" /><span className="text-[10px] font-medium">More</span>
          </button>
        </nav>

      </div>
    </>
  );
}
