import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Calendar as CalendarIcon, TrendingUp, Target, Activity, PieChart, BarChart2, DollarSign } from 'lucide-react';
import useStore from '../store/useStore';

// Helper to format large numbers to K (e.g. 1500 -> 1.5K)
const formatK = (num) => {
  if (!num || num === 0) return '0';
  const absNum = Math.abs(num);
  if (absNum >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(0);
};

// Helper to format currency
const formatMoney = (val) => (val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Helper to calculate held time
const getHeldTime = (start, end) => {
  if (!start || !end) return '--';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 0) return '--';
  const diffMins = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export default function Analytics({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [expandedChargesId, setExpandedChargesId] = useState(null);

  const trades = useStore(state => state.trades || []);

  // --- OVERVIEW METRICS CALCULATIONS ---
  const totalTrades = trades.length;

  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalCharges = 0;

  trades.forEach(t => {
    const pnl = t.grossPnL || 0;
    if (pnl >= 0) {
      grossProfit += pnl;
      winningTrades++;
    } else {
      grossLoss += Math.abs(pnl);
      losingTrades++;
    }

    // Sum exact charges
    if (typeof t.chargesBreakdown === 'object') {
      totalCharges += (t.chargesBreakdown.total || 0);
    } else {
      totalCharges += (t.chargesBreakdown || 0);
    }
  });

  const netPnL = grossProfit - grossLoss - totalCharges;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0.0';
  const avgWin = winningTrades > 0 ? (grossProfit / winningTrades) : 0;
  const avgLoss = losingTrades > 0 ? (grossLoss / losingTrades) : 0;

  // Group trades by date for the calendar
  const pnlByDate = trades.reduce((acc, trade) => {
    if (!trade.date) return acc;
    if (!acc[trade.date]) acc[trade.date] = { net: 0, count: 0 };
    acc[trade.date].net += (trade.netPnL || 0);
    acc[trade.date].count += 1;
    return acc;
  }, {});

  // --- CALENDAR GENERATION LOGIC ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0

  const calendarDays = [];
  // Pad empty days at start
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  // Fill real days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      day: i,
      date: dateStr,
      data: pnlByDate[dateStr] || null
    });
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Swipe to go back
  const [touchStartPos, setTouchStartPos] = useState(null);
  const handleGestureStart = (e) => setTouchStartPos(e.targetTouches[0].clientX);
  const handleGestureEnd = (e) => {
    if (!touchStartPos) return;
    if (touchStartPos - e.changedTouches[0].clientX < -75) onBack();
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#0a0c14] text-[#E8EAED] font-sans relative"
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
      >

        {/* Header */}
        <div className="px-5 py-5 pb-0 bg-[#0a0c14] shrink-0 z-10 border-b border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <ArrowLeft onClick={onBack} className="w-5 h-5 text-white cursor-pointer hover:text-[#3ddc97] transition-colors" />
              <h1 className="text-white font-bold text-xl tracking-wide flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#3ddc97]" /> Analytics
              </h1>
            </div>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer">
              <CalendarIcon className="w-3.5 h-3.5 text-[#6e7284]" />
              <span className="text-xs font-semibold text-[#cfd2dc]">{monthNames[currentMonth]} {currentYear}</span>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="flex space-x-8 px-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-[13px] font-bold tracking-wide transition-all relative ${activeTab === 'overview' ? 'text-[#3ddc97]' : 'text-[#6e7284] hover:text-white'}`}
            >
              Overview
              {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3ddc97] shadow-[0_0_8px_rgba(61,220,151,0.6)]"></div>}
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`pb-3 text-[13px] font-bold tracking-wide transition-all relative ${activeTab === 'trades' ? 'text-[#3ddc97]' : 'text-[#6e7284] hover:text-white'}`}
            >
              Trades & Charges
              {activeTab === 'trades' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#3ddc97] shadow-[0_0_8px_rgba(61,220,151,0.6)]"></div>}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 hide-scrollbar p-4 space-y-4">

          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-300">

              {/* Top Metrics Row */}
              <div className="flex gap-3">
                {/* Net P&L */}
                <div className="flex-1 bg-[#141621] border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#3ddc97]/10 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-[#3ddc97]" />
                  </div>
                  <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1.5">Net P&L</div>
                  <div className={`font-mono text-xl font-bold ${netPnL >= 0 ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>
                    {netPnL >= 0 ? '+' : '−'}₹{Math.abs(netPnL).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-[#5c6072] font-semibold mt-1">Realized this month</div>
                </div>

                {/* Win Rate */}
                <div className="flex-1 bg-[#141621] border border-white/5 rounded-2xl p-4 relative overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-[#3b82f6]" />
                  </div>
                  <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1.5">Win Rate</div>
                  <div className="font-mono text-xl font-bold text-white">
                    {winRate}%
                  </div>
                  <div className="text-[10px] text-[#5c6072] font-semibold mt-1">Total Trades: {totalTrades}</div>
                </div>
              </div>

              {/* Advanced Stats Grid */}
              <div className="bg-[#141621] border border-white/5 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <PieChart className="w-4 h-4 text-[#cfd2dc]" />
                  <h3 className="text-white font-bold text-sm tracking-wide">Performance Breakdown</h3>
                </div>

                <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1">Gross Profit</div>
                    <div className="font-mono font-bold text-[#3ddc97] text-sm">+₹{grossProfit.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1">Gross Loss</div>
                    <div className="font-mono font-bold text-[#ff6b6b] text-sm">−₹{grossLoss.toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1">Avg Win</div>
                    <div className="font-mono font-bold text-white text-sm">₹{Math.round(avgWin).toLocaleString('en-IN')}</div>
                  </div>
                  <div>
                    <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1">Avg Loss</div>
                    <div className="font-mono font-bold text-white text-sm">₹{Math.round(avgLoss).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Total Charges Block */}
                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#ffb74d]/10 flex items-center justify-center">
                       <DollarSign className="w-3.5 h-3.5 text-[#ffb74d]" />
                    </div>
                    <div>
                      <div className="text-[#cfd2dc] text-xs font-bold tracking-wide">Total Charges Paid</div>
                      <div className="text-[#5c6072] text-[9px] font-medium mt-0.5">Brokerage, STT, Taxes</div>
                    </div>
                  </div>
                  <div className="text-[#ffb74d] font-mono font-bold text-sm">
                    −₹{totalCharges.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits:2})}
                  </div>
                </div>
              </div>

              {/* P&L Calendar Heatmap */}
              <div className="bg-[#141621] border border-white/5 rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#cfd2dc]" /> P&L Calendar
                  </h3>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[#5c6072] text-[10px] font-bold mb-2">{day}</div>
                  ))}

                  {calendarDays.map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} className="h-[48px] rounded-lg bg-transparent"></div>;

                    const isToday = cell.date === today.toISOString().split('T')[0];
                    let bgClass = "bg-[#181a24] border border-white/5";
                    let textClass = "text-[#6e7284]";
                    let pnlText = "";

                    if (cell.data !== null) {
                      if (cell.data.net > 0) {
                        bgClass = "bg-[#3ddc97]/10 border border-[#3ddc97]/25";
                        textClass = "text-[#3ddc97]";
                        pnlText = "+" + formatK(cell.data.net);
                      } else if (cell.data.net < 0) {
                        bgClass = "bg-[#ff6b6b]/10 border border-[#ff6b6b]/25";
                        textClass = "text-[#ff6b6b]";
                        pnlText = formatK(cell.data.net); // already has minus sign
                      } else {
                        bgClass = "bg-white/10 border border-white/20";
                        textClass = "text-white";
                        pnlText = "0";
                      }
                    }

                    return (
                      <div key={cell.day} className={`h-[48px] rounded-lg flex flex-col items-center justify-center relative transition-colors ${bgClass} ${isToday ? 'ring-1 ring-white/30' : ''}`}>
                        <span className={`text-[11px] font-bold leading-none mb-1 ${cell.data ? 'text-white/80' : 'text-[#5c6072]'}`}>{cell.day}</span>
                        {cell.data !== null && (
                          <span className={`text-[10px] font-mono font-bold leading-none ${textClass}`}>{pnlText}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between px-1 border-t border-white/5 pt-3">
                  <div className="flex items-center text-[10px] font-semibold text-[#6e7284]"><div className="w-2.5 h-2.5 rounded-sm bg-[#3ddc97] mr-1.5"></div>Profit Day</div>
                  <div className="flex items-center text-[10px] font-semibold text-[#6e7284]"><div className="w-2.5 h-2.5 rounded-sm bg-[#ff6b6b] mr-1.5"></div>Loss Day</div>
                  <div className="flex items-center text-[10px] font-semibold text-[#6e7284]"><div className="w-2.5 h-2.5 rounded-sm bg-[#181a24] border border-white/10 mr-1.5"></div>No Trade</div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TRADES & CHARGES TAB ================= */}
          {activeTab === 'trades' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {trades.length === 0 ? (
                <div className="text-center py-10 text-[#6e7284] text-xs font-medium">No trades recorded yet.</div>
              ) : (
                trades.map(trade => {
                  const isOpen = expandedTradeId === trade.tradeId;
                  const isChargesOpen = expandedChargesId === trade.tradeId;
                  const isProfit = (trade.netPnL || 0) >= 0;

                  // Extract Data safely
                  const entryTime = trade.entryTime ? new Date(trade.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                  const exitTime = trade.exitTime ? new Date(trade.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--';
                  const heldTime = getHeldTime(trade.entryTime, trade.exitTime);

                  // Extract charges
                  const cObj = typeof trade.chargesBreakdown === 'object' ? trade.chargesBreakdown : { total: trade.chargesBreakdown || 0 };

                  return (
                    <div key={trade.tradeId} className={`bg-[#141621] border ${isOpen ? 'border-white/15' : 'border-white/5'} rounded-2xl overflow-hidden shadow-sm transition-all duration-200`}>

                      {/* Trade Header Row */}
                      <div
                        onClick={() => {
                          setExpandedTradeId(isOpen ? null : trade.tradeId);
                          if (isOpen) setExpandedChargesId(null);
                        }}
                        className="flex justify-between items-center p-4 cursor-pointer hover:bg-white/5 transition-colors select-none"
                      >
                        <div>
                          <div className="flex items-center">
                            <span className="text-[#e2e5eb] text-[14px] font-bold tracking-wide">{trade.index || 'OPT'} {trade.strike || 0}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-2 ${trade.type === 'CE' ? 'bg-[#3ddc97]/15 text-[#3ddc97]' : 'bg-[#ff6b6b]/15 text-[#ff6b6b]'}`}>{trade.type || 'OPT'}</span>
                          </div>
                          <div className="text-[#6e7284] text-[10.5px] font-medium mt-1 tracking-wide">
                            {trade.date} · {trade.qty} Qty
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className={`font-mono text-[15px] font-bold ${isProfit ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>
                              {isProfit ? '+' : '−'}₹{Math.abs(trade.netPnL || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-[#5c6072] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Trade Collapsible Details */}
                      {isOpen && (
                        <div className="px-4 pb-4 pt-0 bg-[#0a0c14]/30 border-t border-white/5">

                          {/* Timings & Reasons */}
                          <div className="flex justify-between items-start py-3 border-b border-white/5">
                            <div className="flex-1">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wider mb-1">Entry</div>
                              <div className="text-white text-xs font-bold mb-1">{entryTime}</div>
                              <div className="text-[#9598a8] text-[10px] font-medium bg-white/5 border border-white/5 inline-block px-2 py-0.5 rounded-full">{trade.entryReason || 'Manual'}</div>
                            </div>
                            <div className="w-[1px] bg-white/5 mx-3 self-stretch"></div>
                            <div className="flex-1 text-right">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wider mb-1">Exit</div>
                              <div className="text-white text-xs font-bold mb-1">{exitTime}</div>
                              <div className={`text-[10px] font-medium border inline-block px-2 py-0.5 rounded-full ${trade.exitReason === 'Target Hit' ? 'bg-[#3ddc97]/10 border-[#3ddc97]/20 text-[#3ddc97]' : trade.exitReason === 'Stop Loss Hit' ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/20 text-[#ff6b6b]' : 'bg-white/5 border-white/5 text-[#9598a8]'}`}>
                                {trade.exitReason || 'Unknown'}
                              </div>
                            </div>
                          </div>

                          {/* Prices & P&L Grid */}
                          <div className="grid grid-cols-4 gap-2 bg-[#181a24] border border-white/5 rounded-xl py-3 mt-3 mb-3">
                            <div className="text-center border-r border-white/5">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Buy</div>
                              <div className="text-[#e2e5eb] text-[11px] font-mono font-bold mt-1.5">₹{(trade.entryPremium || 0).toFixed(2)}</div>
                            </div>
                            <div className="text-center border-r border-white/5">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Sell</div>
                              <div className="text-[#e2e5eb] text-[11px] font-mono font-bold mt-1.5">₹{(trade.exitPremium || 0).toFixed(2)}</div>
                            </div>
                            <div className="text-center border-r border-white/5">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Held</div>
                              <div className="text-[#e2e5eb] text-[11px] font-mono font-bold mt-1.5">{heldTime}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Gross</div>
                              <div className={`text-[11px] font-mono font-bold mt-1.5 ${trade.grossPnL >= 0 ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>
                                {trade.grossPnL >= 0 ? '+' : '−'}{Math.abs(trade.grossPnL || 0).toFixed(0)}
                              </div>
                            </div>
                          </div>

                          {/* Exact Charges Dropdown */}
                          <div className={`bg-[#1c1e2b] border rounded-xl overflow-hidden transition-colors ${isChargesOpen ? 'border-[#ffb74d]/30' : 'border-white/5'}`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setExpandedChargesId(isChargesOpen ? null : trade.tradeId); }}
                              className="w-full flex justify-between items-center p-3 focus:outline-none transition-colors hover:bg-white/5"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-[11px] font-bold text-[#d5d7e0] uppercase tracking-wide">Taxes & Charges</span>
                              </div>
                              <div className="flex items-center text-xs font-mono font-bold text-[#ffb74d]">
                                −₹{(cObj.total || 0).toFixed(2)}
                                <ChevronDown className={`w-4 h-4 text-[#6e7284] ml-2 transition-transform duration-200 ${isChargesOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </button>

                            {isChargesOpen && (
                              <div className="px-4 pb-4 pt-1 bg-[#181a24] border-t border-white/5 space-y-2.5">
                                {cObj.bro !== undefined ? (
                                  <>
                                    <div className="flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-[#6e7284] font-sans font-medium">Brokerage</span>
                                      <span className="text-white/80">₹{cObj.bro.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-[#6e7284] font-sans font-medium">STT / CTT</span>
                                      <span className="text-white/80">₹{cObj.stt.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-[#6e7284] font-sans font-medium">Exchange Txn</span>
                                      <span className="text-white/80">₹{cObj.txn.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-mono">
                                      <span className="text-[#6e7284] font-sans font-medium">SEBI / Stamp</span>
                                      <span className="text-white/80">₹{(cObj.sebi + cObj.stamp).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-mono pt-1.5 border-t border-white/5">
                                      <span className="text-[#6e7284] font-sans font-medium">GST (18%)</span>
                                      <span className="text-white/80">₹{cObj.gst.toFixed(2)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center text-[11px] text-[#6e7284] py-1">Legacy trade. Detailed breakdown unavailable.</div>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
