import React from 'react';
import { Settings2, Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal, Lightbulb, ChevronRight, Eye, ArrowUp, ArrowDown } from 'lucide-react';

export default function Dashboard({ onNavigateToTrade }) {
  const availableMargin = 814570;
  const usedMargin = 185430;
  const overallPnL = 45320;
  const overallPnLPct = 5.56;
  const todayPnL = 2450;
  const todayPnLPct = 0.25;

  const indices = [
    { name: 'NIFTY', val: '24238.15', change: 252.80, pct: 1.05, expiry: 'Tue' },
    { name: 'SENSEX', val: '77627.50', change: 861.66, pct: 1.12, expiry: 'Tomorrow' },
    { name: 'BANKNIFTY', val: '52945.00', change: -112.80, pct: -0.21, expiry: 'Wed' },
    { name: 'FINNIFTY', val: '23800.00', change: 45.20, pct: 0.18, expiry: 'Mon' }
  ];

  const positions = [
    { id: 1, symbol: 'NIFTY', strike: 24150, type: 'CE', qty: 25, ltp: 139.45, pnl: 1250, pnlPct: 12.45 },
    { id: 2, symbol: 'BANKNIFTY', strike: 56000, type: 'PE', qty: 15, ltp: 210.10, pnl: -770, pnlPct: -6.12 }
  ];

  const navigateToOptionChain = (indexName) => {
    if (onNavigateToTrade) {
      onNavigateToTrade();
    } else {
      alert("Will navigate to Option Chain for: " + indexName);
    }
  };

  const navigateToPositions = () => alert("Will navigate to the dedicated Positions Tab");
  const openDailySetupModal = () => alert("Will open modal to manually set Spot Prices for the 4 indexes.");

  return (
    <>
      <style>{"\n        .hide-scrollbar::-webkit-scrollbar { display: none; }\n        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }\n      "}</style>

      <div className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#e2e5eb] font-sans relative overflow-hidden">

        <header className="px-5 py-4 flex items-center justify-between bg-[#141824] sticky top-0 z-20">
          <h1 className="text-white font-bold text-xl tracking-wide flex items-center">
            Option<span className="text-[#35b89e]">Lab</span>
          </h1>
          <button onClick={openDailySetupModal} className="p-2 bg-[#181c2a] border border-[#252b3d] rounded-lg text-[#828b9d] hover:text-white hover:border-[#828b9d] transition-colors focus:outline-none">
            <Settings2 className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar">

          <div className="px-4 pt-2 mb-6">
            <div className="bg-gradient-to-br from-[#1d2435] via-[#171b26] to-[#141824] border border-[#252b3d] rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rotate-45 translate-x-20 -translate-y-32 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-[32px] font-bold text-white tracking-tight">₹{availableMargin.toLocaleString('en-IN')}</h2>
                  <Eye className="w-5 h-5 text-[#828b9d] cursor-pointer hover:text-white transition-colors" />
                </div>

                <div className="flex items-center text-[#35b89e] text-sm font-semibold mb-6">
                  <ArrowUp className="w-4 h-4 mr-1" />
                  Overall Gain +₹{overallPnL.toLocaleString('en-IN')} (+{overallPnLPct}%)
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-[#252b3d]/50">
                  <div>
                    <p className="text-[#828b9d] text-xs mb-1 font-medium tracking-wide">Invested Value</p>
                    <p className="text-white font-bold text-[15px]">₹{usedMargin.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#828b9d] text-xs mb-1 font-medium tracking-wide flex items-center justify-end">
                      <ArrowUp className="w-3 h-3 mr-1 text-[#35b89e]" /> Today's Gain
                    </p>
                    <p className="text-[#35b89e] font-bold text-[15px]">
                      +₹{todayPnL.toLocaleString('en-IN')} <span className="font-semibold text-xs ml-0.5">(+{todayPnLPct}%)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mb-7">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-[15px] font-semibold text-gray-200">Markets Today</h3>
            </div>

            <div className="flex space-x-3 overflow-x-auto hide-scrollbar pb-2">
              {indices.map((idx) => {
                const isDown = idx.change < 0;
                return (
                  <button key={idx.name} onClick={() => navigateToOptionChain(idx.name)} className="bg-[#181c2a] border border-[#252b3d] rounded-lg p-3.5 min-w-[165px] shrink-0 flex flex-col relative overflow-hidden text-left hover:bg-[#1d2232] transition-colors focus:outline-none shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-white tracking-wide">{idx.name}</h4>
                      <div className={"text-sm font-bold flex items-center " + (isDown ? "text-[#e64b4b]" : "text-[#35b89e]")}>
                        {idx.val}
                        {isDown ? <ArrowDown className="w-4 h-4 ml-0.5" strokeWidth={2.5} /> : <ArrowUp className="w-4 h-4 ml-0.5" strokeWidth={2.5} />}
                      </div>
                    </div>

                    <div className="flex justify-between items-center w-full">
                      <span className="bg-[#10141a] border border-[#252b3d] text-[#828b9d] text-[10px] font-medium px-2 py-1 rounded shadow-inner">Expiry {idx.expiry}</span>
                      <span className="text-[11px] font-semibold text-[#828b9d]">{isDown ? "" : "+"}{idx.change} ({isDown ? "" : "+"}{idx.pct}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-7">
            <button onClick={navigateToPositions} className="w-full flex justify-between items-end mb-4 focus:outline-none group">
              <div className="flex items-center space-x-2">
                <h3 className="text-[15px] font-semibold text-gray-200">Open Positions</h3>
                <span className="text-[11px] font-bold text-[#828b9d] bg-[#1d2232] border border-[#252b3d] px-2 py-0.5 rounded">{positions.length}</span>
              </div>
              <div className="flex items-center text-xs font-bold text-[#35b89e] group-hover:text-white transition-colors">
                VIEW ALL <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </button>

            <div className="space-y-3">
              {positions.map(pos => {
                const isProfit = pos.pnl >= 0;
                return (
                  <button key={pos.id} onClick={navigateToPositions} className="w-full bg-[#181c2a] border border-[#252b3d] rounded-lg p-4 flex justify-between items-center hover:bg-[#1d2232] transition-colors focus:outline-none text-left shadow-sm">
                    <div>
                      <h4 className="text-[15px] font-bold text-white mb-1.5 flex items-center">{pos.symbol} {pos.strike} {pos.type}</h4>
                      <p className="text-xs text-[#828b9d] font-medium">Qty {pos.qty} <span className="mx-2 text-[#252b3d]">|</span> LTP {pos.ltp.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <div className={"text-[15px] font-bold mb-1 " + (isProfit ? "text-[#35b89e]" : "text-[#e64b4b]")}>{isProfit ? "+" : ""}₹{Math.abs(pos.pnl).toLocaleString('en-IN')}</div>
                      <div className={"text-xs font-semibold " + (isProfit ? "text-[#35b89e]" : "text-[#e64b4b]")}>{isProfit ? "+" : ""}{pos.pnlPct}%</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 mb-4">
            <h3 className="text-[15px] font-semibold text-gray-200 mb-4">Today's Insight</h3>
            <div className="bg-[#181c2a] border border-[#252b3d] rounded-lg p-4 flex items-start space-x-4 shadow-sm">
              <div className="bg-[#1d2232] p-2.5 rounded-lg border border-[#252b3d] shrink-0">
                <Lightbulb className="w-6 h-6 text-[#f59e0b]" />
              </div>
              <p className="text-[13px] text-[#828b9d] leading-relaxed font-medium pt-0.5">
                Your last 5 losing trades were entered after <span className="text-gray-300 font-bold">2:00 PM</span>. Try focusing on morning setups to improve your win rate.
              </p>
            </div>
          </div>
        </div>

        <nav className="absolute bottom-0 w-full bg-[#141824] border-t border-[#252b3d] flex justify-around items-center h-[72px] pb-safe z-40">
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#35b89e]"><Home className="w-6 h-6 mb-1.5" /><span className="text-[11px] font-semibold">Home</span></button>
          <button onClick={navigateToPositions} className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors"><Briefcase className="w-6 h-6 mb-1.5" /><span className="text-[11px] font-medium">Positions</span></button>
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors"><ArrowLeftRight className="w-6 h-6 mb-1.5" /><span className="text-[11px] font-medium">Trade</span></button>
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors"><BarChart2 className="w-6 h-6 mb-1.5" /><span className="text-[11px] font-medium">Analytics</span></button>
          <button className="flex flex-col items-center justify-center w-16 h-full text-[#828b9d] hover:text-white transition-colors"><MoreHorizontal className="w-6 h-6 mb-1.5" /><span className="text-[11px] font-medium">More</span></button>
        </nav>
      </div>
    </>
  );
}
