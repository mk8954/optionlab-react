import React, { useState } from 'react';
import { Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal, ChevronRight, Eye, EyeOff, ArrowUp, ArrowDown, Settings2, GripHorizontal, Eye as EyeIcon, EyeOff as EyeOffIcon, X } from 'lucide-react';
import AppLogo from '../assets/logo.png';
import useStore from '../store/useStore';

const PREV_CLOSES = { NIFTY: 24105.35, BANKNIFTY: 53057.80, FINNIFTY: 23754.80, SENSEX: 76765.84 };

export default function Dashboard({ onNavigateToTrade, onNavigateToPositions, onNavigateToAnalytics, onSelectIndex, onNavigateToMore, onOpenConfig }) {
  const [hideBalance, setHideBalance] = useState(false);

  // Zustand Store Pull
  const wallet = useStore(state => state.wallet) || { availableCash: 0, investedMargin: 0 };
  const openPositions = useStore(state => state.openPositions) || [];
  const trades = useStore(state => state.trades) || [];
  const statement = useStore(state => state.statement) || [];

  const settings = useStore(state => state.settings) || {};
  const spotLevels = settings.spotLevels || {};
  const selectedExpiries = settings.selectedExpiries || {};
  const generatedExpiries = settings.generatedExpiries || {};

  const customIndices = settings.customIndices || [];
  const indexOrder = settings.indexOrder || ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'];
  const updateIndexOrder = useStore(state => state.updateIndexOrder);

  // Reorder & Visibility Modal State
  const [showManageModal, setShowManageModal] = useState(false);
  const [activeIndices, setActiveIndices] = useState([]);
  const [hiddenIndices, setHiddenIndices] = useState([]);

  // Initialization for Manage Modal
  const openManageModal = () => {
    const allAvailable = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY', ...customIndices.map(i => i.name)];
    // Ensure all stored active indices actually exist
    const validActive = indexOrder.filter(i => allAvailable.includes(i));
    const validHidden = allAvailable.filter(i => !validActive.includes(i));

    setActiveIndices(validActive);
    setHiddenIndices(validHidden);
    setShowManageModal(true);
  };

  const moveItem = (index, direction) => {
    const newOrder = [...activeIndices];
    if (direction === -1 && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 1 && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setActiveIndices(newOrder);
  };

  const toggleVisibility = (idxName, isHiding) => {
    if (isHiding) {
      setActiveIndices(activeIndices.filter(i => i !== idxName));
      setHiddenIndices([...hiddenIndices, idxName]);
    } else {
      setHiddenIndices(hiddenIndices.filter(i => i !== idxName));
      setActiveIndices([...activeIndices, idxName]);
    }
  };

  const saveVisibilityOrder = () => {
    if (updateIndexOrder) updateIndexOrder(activeIndices);
    setShowManageModal(false);
  };

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

  // Map the dashboard displays based purely on the `indexOrder` setting
  const indices = indexOrder.map(name => {
    const currentVal = spotLevels[name] || 1000;
    const prevClose = PREV_CLOSES[name] || 1000;
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

  // --- LIVE P&L CALCULATIONS ---
  const overallNet = trades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const totalDeposits = statement.filter(s => s.type === 'deposit').reduce((acc, s) => acc + s.amount, 0);
  const overallPct = totalDeposits > 0 ? (overallNet / totalDeposits) * 100 : 0;
  const isOverallProfit = overallNet >= 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRealizedPnL = trades.filter(t => t.date === todayStr).reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const unrealizedPnL = openPositions.reduce((acc, p) => acc + (p.runningPnL || 0), 0);
  const todayTotalPnL = todayRealizedPnL + unrealizedPnL;
  const todayPnLPct = wallet.investedMargin > 0 ? (todayTotalPnL / wallet.investedMargin) * 100 : 0;

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
            <h1 className="text-white font-bold text-xl tracking-wide">Option<span className="text-[#00D9B5]">Lab</span></h1>
          </div>
          <button onClick={onOpenConfig} className="p-2 bg-[#181c2a] border border-[#252b3d] rounded-lg text-[#828b9d] hover:text-white transition-colors focus:outline-none shadow-sm">
            <Settings2 className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 hide-scrollbar">

          {/* WALLET HERO CARD */}
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

              <div className={`flex items-center text-[13px] font-semibold mb-6 ${isOverallProfit ? 'text-[#00D9B5]' : 'text-[#FF5C5C]'}`}>
                {isOverallProfit ? <ArrowUp className="w-3.5 h-3.5 mr-1" /> : <ArrowDown className="w-3.5 h-3.5 mr-1" />}
                Overall Gain {isOverallProfit ? '+' : '−'}₹{Math.abs(overallNet).toLocaleString('en-IN', {minimumFractionDigits: 0})}
                <span className="ml-1">({isOverallProfit ? '+' : ''}{overallPct.toFixed(2)}%)</span>
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-[#31384e]">
                <div>
                  <p className="text-[#828b9d] text-[11px] font-semibold tracking-wide mb-1">Invested Margin</p>
                  <p className="text-white font-bold text-[15px]">{formatMoney(wallet.investedMargin)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#828b9d] text-[11px] font-semibold tracking-wide mb-1 flex items-center justify-end">
                    {todayTotalPnL >= 0 ? <ArrowUp className="w-3 h-3 mr-1 text-[#00D9B5]" /> : <ArrowDown className="w-3 h-3 mr-1 text-[#FF5C5C]" />} Today's P&L
                  </p>
                  <p className={`font-bold text-[15px] ${todayTotalPnL >= 0 ? 'text-[#00D9B5]' : 'text-[#FF5C5C]'}`}>
                    {todayTotalPnL >= 0 ? '+' : '−'}₹{Math.abs(todayTotalPnL).toLocaleString('en-IN')} <span className="font-semibold text-xs ml-0.5">({todayPnLPct >= 0 ? '+' : ''}{todayPnLPct.toFixed(2)}%)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 mb-6">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-[14px] font-bold text-gray-200">Markets Today</h3>
              <button onClick={openManageModal} className="text-[#828b9d] hover:text-[#00D9B5] transition-colors flex items-center text-xs font-semibold">
                <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage
              </button>
            </div>

            {indices.length === 0 ? (
                <div className="text-center text-[#828b9d] text-xs font-medium py-6 bg-[#181c2a] border border-[#252b3d] rounded-2xl">
                    All indices hidden. Click Manage to restore them.
                </div>
            ) : (
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
            )}
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
                          {isProfit ? "+" : "−"}₹{Math.abs(pos.runningPnL || 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* VISIBILITY & ORDER MANAGER MODAL */}
        {showManageModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="bg-[#181c2a] border border-[#252b3d] p-5 rounded-2xl w-full max-w-sm shadow-2xl animate-in fade-in duration-200">
              <div className="flex justify-between items-start mb-4 mt-1">
                <div>
                  <h3 className="text-white font-bold text-lg tracking-wide">Manage Indices</h3>
                  <p className="text-[#828b9d] text-xs font-medium mt-1">Set visibility & order on your dashboard</p>
                </div>
                <X onClick={() => setShowManageModal(false)} className="w-5 h-5 text-[#828b9d] cursor-pointer hover:text-white" />
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-1 hide-scrollbar space-y-5 mb-6">

                {/* Active/Visible Section */}
                <div>
                  <div className="text-[#828b9d] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center"><EyeIcon className="w-3.5 h-3.5 mr-1"/> Visible on Dashboard</div>
                  <div className="space-y-2">
                    {activeIndices.length === 0 && <div className="text-[#5c6072] text-xs italic">No indices visible</div>}
                    {activeIndices.map((idxName, i) => (
                      <div key={idxName} className="flex items-center justify-between bg-[#10141a] border border-[#252b3d] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => toggleVisibility(idxName, true)} className="text-[#828b9d] hover:text-[#ff6b6b] transition-colors" title="Hide Index"><EyeOffIcon size={16} /></button>
                          <span className="text-white font-bold text-sm tracking-wide">{idxName}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveItem(i, -1)} disabled={i === 0} className={`p-1 rounded ${i === 0 ? 'text-[#252b3d]' : 'text-[#828b9d] hover:text-[#00D9B5]'}`}><ArrowUp size={16} strokeWidth={3} /></button>
                          <button onClick={() => moveItem(i, 1)} disabled={i === activeIndices.length - 1} className={`p-1 rounded ${i === activeIndices.length - 1 ? 'text-[#252b3d]' : 'text-[#828b9d] hover:text-[#00D9B5]'}`}><ArrowDown size={16} strokeWidth={3} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hidden Section */}
                {hiddenIndices.length > 0 && (
                  <div>
                    <div className="text-[#828b9d] text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center"><EyeOffIcon className="w-3.5 h-3.5 mr-1"/> Hidden</div>
                    <div className="space-y-2 opacity-60 hover:opacity-100 transition-opacity">
                      {hiddenIndices.map((idxName) => (
                        <div key={idxName} className="flex items-center justify-between bg-[#10141a] border border-[#252b3d] border-dashed rounded-xl p-3">
                          <span className="text-[#828b9d] font-bold text-sm tracking-wide">{idxName}</span>
                          <button onClick={() => toggleVisibility(idxName, false)} className="text-[#828b9d] hover:text-[#00D9B5] flex items-center text-xs font-bold transition-colors">
                            <EyeIcon size={14} className="mr-1"/> Show
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={saveVisibilityOrder}
                className="w-full py-3.5 bg-[#00D9B5] hover:bg-[#00c4a3] text-[#06110E] rounded-xl font-bold text-xs tracking-wider transition-colors shadow-lg"
              >
                SAVE DASHBOARD LAYOUT
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
