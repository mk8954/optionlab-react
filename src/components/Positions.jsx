import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import useStore from '../store/useStore';

// Helper to calculate time difference
const getHeldTime = (start, end) => {
  if (!start) return '--';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diffMs = e - s;
  if (diffMs < 0) return '--';
  const diffMins = Math.floor(diffMs / 60000);
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Helper to exactly calculate charges for Break Even
const calcCharges = (buyPrice, sellPrice, q, isRoundTrip = true) => {
  const buyTO = buyPrice * q;
  const sellTO = isRoundTrip ? (sellPrice * q) : 0;
  const totalTO = buyTO + sellTO;
  const bro = isRoundTrip ? 40.00 : 20.00;
  const stt = Math.round((sellTO * 0.0015) * 100) / 100;
  const txn = Math.round((totalTO * 0.0003503) * 100) / 100;
  const sebi = Math.round((totalTO * 0.000001) * 100) / 100;
  const stamp = Math.round((buyTO * 0.00003) * 100) / 100;
  const gst = Math.round(((bro + txn + sebi) * 0.18) * 100) / 100;
  return bro + stt + txn + sebi + stamp + gst;
};

export default function Positions({ onBack }) {
  const [activeTab, setActiveTab] = useState('open');
  const [exitModalPos, setExitModalPos] = useState(null);
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [ltpInputs, setLtpInputs] = useState({});
  const [now, setNow] = useState(Date.now());
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [customReasonText, setCustomReasonText] = useState("");

  // Swipe-to-go-back gesture
  const [touchStartPos, setTouchStartPos] = useState(null);
  const handleGestureStart = (e) => setTouchStartPos(e.targetTouches[0].clientX);
  const handleGestureEnd = (e) => {
    if (!touchStartPos) return;
    const distance = touchStartPos - e.changedTouches[0].clientX;
    if (distance < -75) onBack();
  };

  // Force re-render every minute to update the "Held" time dynamically
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Zustand Store
  const openPositions = useStore(state => state.openPositions || []);
  const trades = useStore(state => state.trades || []);
  const wallet = useStore(state => state.wallet || { investedMargin: 0, availableCash: 0 });
  const lotSizes = useStore(state => state.settings?.lotSizes || { NIFTY: 65, BANKNIFTY: 30, FINNIFTY: 60, SENSEX: 20 });
  const updatePositionLTP = useStore(state => state.updatePositionLTP);
  const closePosition = useStore(state => state.closePosition);

  // Derived Stats safely
  const totalUnrealizedPnL = openPositions.reduce((acc, p) => acc + (p.runningPnL || 0), 0);

  // Today's Closed Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrades = trades.filter(t => t.date === todayStr);
  const netToday = todayTrades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const winningTrades = todayTrades.filter(t => (t.netPnL || 0) > 0).length;
  const winRate = todayTrades.length > 0 ? Math.round((winningTrades / todayTrades.length) * 100) : 0;

  const handleUpdateLTP = (posId) => {
    const val = parseFloat(ltpInputs[posId]);
    if (!isNaN(val) && val >= 0) {
      updatePositionLTP(posId, val);
      setLtpInputs(prev => ({ ...prev, [posId]: '' }));
    }
  };

  const handleExitTrade = (reason) => {
    if (exitModalPos) {
      closePosition(exitModalPos.id, exitModalPos.currentPremium || 0, reason);
      setExitModalPos(null);
      setShowCustomReason(false);
      setCustomReasonText("");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

        .pos-wrapper {
          background: #14161f;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

        .header { padding: 20px 22px 14px 22px; display: flex; flex-direction: column; }
        .header-top { display: flex; items-center; gap: 12px; margin-bottom: 4px; }
        .title { color: #e8e9ee; font-size: 19px; font-weight: 700; }
        .title-sub { color: #6e7284; font-size: 11.5px; margin-top: 2px; padding-left: 36px;}

        .tabs { display: flex; gap: 6px; margin-top: 14px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 10px; }
        .tab { flex: 1; text-align: center; padding: 8px 0; border-radius: 7px; font-size: 12.5px; font-weight: 600; color: #6e7284; cursor: pointer; transition: all 0.2s;}
        .tab.active { background: rgba(255,255,255,0.06); color: #cfd2dc; }

        .summary { display: flex; justify-content: space-between; padding: 16px 22px 4px 22px; }
        .summary .box .label { color: #6e7284; font-size: 11px; font-weight: 500; }
        .summary .box .val { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #cfd2dc; margin-top: 3px; }
        .summary .box.pl .val { color: #3ddc97; }
        .summary .box.pl .val.neg { color: #ff6b6b; }

        .list { padding: 14px 22px 22px 22px; display: flex; flex-direction: column; gap: 12px; }
        .pos-card { background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 14px 16px; }
        .pos-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .pos-name { color: #d5d7e0; font-size: 14px; font-weight: 700; }
        .pos-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 5px; margin-left: 6px; vertical-align: middle; }
        .badge-ce { background: rgba(61,220,151,0.16); color: #3ddc97; }
        .badge-pe { background: rgba(255,107,107,0.16); color: #ff6b6b; }
        .pos-expiry { color: #6b7390; font-size: 11px; margin-top: 3px; }
        .pos-pl { text-align: right; }
        .pos-pl .amt { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; }
        .pos-pl .amt.pos { color: #3ddc97; }
        .pos-pl .amt.neg { color: #ff6b6b; }
        .pos-pl .pct { font-size: 10.5px; color: #6fce9e; font-weight: 600; }
        .pos-pl .pct.neg { color: #ff9c9c; }

        .progress-wrap { margin-top: 14px; }
        .progress-labels { display: flex; justify-content: space-between; font-size: 10px; color: #6b7390; margin-bottom: 5px; font-weight: 600;}
        .progress-labels .sl { color: #ff6b6b; }
        .progress-labels .tgt { color: #3ddc97; }
        .progress-track { height: 5px; border-radius: 3px; background: rgba(255,255,255,0.06); position: relative; }
        .progress-fill { position: absolute; top: 0; left: 0; height: 100%; border-radius: 3px; background: linear-gradient(90deg, #ff6b6b, #3ddc97); width: 100%; }
        .progress-dot { position: absolute; top: -3px; width: 11px; height: 11px; border-radius: 50%; background: #fff; border: 2px solid #191b26; box-shadow: 0 0 0 2px #3ddc97; transition: left 0.3s ease; }

        .pos-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 14px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 10px 0; }
        .meta-item { text-align: center; position: relative; }
        .meta-item:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 2px; bottom: 2px; width: 1px; background: rgba(255,255,255,0.06); }
        .meta-item .l { color: #5c6072; font-size: 9.5px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; }
        .meta-item .v { color: #d5d7e0; font-size: 13px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }

        .entry-reason { margin-top: 10px; display: flex; align-items: center; gap: 6px; }
        .entry-reason .l { color: #5c6072; font-size: 10px; font-weight: 500;}
        .entry-reason .chip { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,0.05); color: #9598a8; }

        .update-row { display: flex; gap: 10px; margin-top: 14px; align-items: center; }
        .price-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; color: #d5d7e0; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; outline: none; min-width: 0; text-align: center; transition: border-color 0.2s; }
        .price-input::placeholder { color: #5c6072; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 11px; }
        .price-input:focus { border-color: rgba(61,220,151,0.4); }
        .update-btn { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: #cfd2dc; font-size: 12px; font-weight: 600; padding: 8px 0; border-radius: 8px; cursor: pointer; transition: background 0.2s;}
        .update-btn:active { background: rgba(255,255,255,0.1); }

        .exit-btn { width: 100%; margin-top: 10px; background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.25); color: #ff6b6b; font-size: 12.5px; font-weight: 700; padding: 10px 0; border-radius: 8px; cursor: pointer; letter-spacing: 0.3px; transition: background 0.2s;}
        .exit-btn:active { background: rgba(255,107,107,0.18); }

        /* Exit reason modal */
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
        .sheet { width: 100%; max-width: 448px; background: #181a24; border-radius: 18px 18px 0 0; padding: 20px 22px 26px 22px; border: 1px solid rgba(255,255,255,0.06); border-bottom: none; animation: slideUp 0.3s ease-out forwards;}
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .sheet-title { color: #d5d7e0; font-size: 15px; font-weight: 700; margin-bottom: 3px; }
        .sheet-sub { color: #6e7284; font-size: 11.5px; margin-bottom: 16px; font-weight: 500;}
        .reason-btn { width: 100%; text-align: left; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: #cfd2dc; padding: 12px 14px; border-radius: 10px; font-size: 13.5px; font-weight: 600; margin-bottom: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
        .reason-btn:active { background: rgba(255,255,255,0.08); }
        .reason-btn .arrow { color: #5c6072; font-size: 16px;}
        .cancel-btn { width: 100%; background: none; border: none; color: #6e7284; padding: 10px 0; font-size: 13px; font-weight: 600; margin-top: 6px; cursor: pointer; }

        .reason-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 14px; color: #d5d7e0; font-size: 13.5px; outline: none; margin-bottom: 10px; font-family: 'Inter', sans-serif;}
        .reason-input:focus { border-color: rgba(61,220,151,0.4); }
        .confirm-btn { width: 100%; background: rgba(61,220,151,0.1); border: 1px solid rgba(61,220,151,0.25); color: #3ddc97; font-size: 13.5px; font-weight: 700; padding: 12px 0; border-radius: 8px; cursor: pointer; letter-spacing: 0.3px; transition: background 0.2s;}
        .confirm-btn:active { background: rgba(61,220,151,0.18); }

        /* Closed (today) list */
        .stats-strip { display: flex; justify-content: space-between; padding: 14px 22px; margin: 14px 22px 0 22px; background: rgba(255,255,255,0.03); border-radius: 12px; }
        .stat .l { color: #6e7284; font-size: 10.5px; font-weight: 600;}
        .stat .v { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #cfd2dc; margin-top: 3px; }
        .stat .v.win { color: #3ddc97; }
        .stat .v.loss { color: #ff6b6b; }

        .closed-list { padding: 6px 22px 22px 22px; }
        .closed-row { border-top: 1px solid rgba(255,255,255,0.05); cursor: pointer; }
        .closed-list .closed-row:first-of-type { border-top: none; }
        .row-main { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; }
        .name-row { display: flex; align-items: center; }
        .row-right { display: flex; align-items: center; gap: 8px; }
        .row-right .amt { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; }
        .row-right .amt.pos { color: #3ddc97; }
        .row-right .amt.neg { color: #ff6b6b; }
        .sub-row { color: #5c6072; font-size: 10px; margin-top: 3px; font-weight: 500;}
        .chev { color: #5c6072; font-size: 15px; font-weight: 600; transition: transform 0.2s ease; }
        .closed-row.open .chev { transform: rotate(90deg); }

        .detail { max-height: 0; overflow: hidden; transition: max-height 0.25s ease; }
        .closed-row.open .detail { max-height: 250px; }
        .detail-inner { padding: 2px 0 14px 0; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px 6px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 10px 0; }
        .d-item { text-align: center; position: relative; }
        .d-item:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 2px; bottom: 2px; width: 1px; background: rgba(255,255,255,0.06); }
        .d-item .l { color: #5c6072; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .d-item .v { color: #cfd2dc; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
        .d-item .v.pos { color: #3ddc97; } .d-item .v.neg { color: #ff6b6b; }

        .reason-row { display: flex; gap: 8px; margin-top: 10px; }
        .reason-box { flex: 1; text-align: center; padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); }
        .reason-box .l { color: #5c6072; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .reason-box .v { font-size: 11px; font-weight: 700; margin-top: 4px; }
        .reason-box .v.entry { color: #9598a8; }
        .reason-box .v.exit.target { color: #3ddc97; }
        .reason-box .v.exit.sl { color: #ff6b6b; }
        .reason-box .v.exit.other { color: #9598a8; }
      `}</style>

      <div
        className="pos-wrapper sm:max-w-md sm:mx-auto"
        onTouchStart={handleGestureStart}
        onTouchEnd={handleGestureEnd}
      >

        {/* Header */}
        <div className="header">
          <div className="header-top">
            <ArrowLeft onClick={onBack} className="w-5 h-5 text-white cursor-pointer hover:text-[#3ddc97] transition-colors" />
            <div className="title">Positions</div>
          </div>
          <div className="title-sub">Today · {formatDate(new Date())}</div>

          <div className="tabs">
            <div className={`tab ${activeTab === 'open' ? 'active' : ''}`} onClick={() => setActiveTab('open')}>
              Open ({openPositions.length})
            </div>
            <div className={`tab ${activeTab === 'closed' ? 'active' : ''}`} onClick={() => setActiveTab('closed')}>
              Closed Today ({todayTrades.length})
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">

          {/* ================= OPEN TAB ================= */}
          {activeTab === 'open' && (
            <div>
              <div className="summary">
                <div className="box">
                  <div className="label">Total Invested</div>
                  <div className="val">₹{(wallet?.investedMargin || 0).toLocaleString('en-IN', {minimumFractionDigits: 0})}</div>
                </div>
                <div className={`box pl`}>
                  <div className="label">Unrealized P/L</div>
                  <div className={`val ${totalUnrealizedPnL < 0 ? 'neg' : ''}`}>
                    {totalUnrealizedPnL >= 0 ? '+' : '-'}₹{Math.abs(totalUnrealizedPnL).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </div>
                </div>
              </div>

              <div className="list">
                {openPositions.length === 0 ? (
                  <div style={{textAlign:'center', padding:'30px 20px', color:'#5c6072', fontSize:'12.5px', fontWeight:'500'}}>No open positions.</div>
                ) : (
                  openPositions.map(pos => {
                    const runningPnL = pos.runningPnL || 0;
                    const marginUsed = pos.marginUsed || 1;
                    const isProfit = runningPnL >= 0;
                    const plPct = (runningPnL / marginUsed) * 100;

                    const entryPremium = pos.entryPremium || 0;
                    const currentPremium = pos.currentPremium || 0;

                    const sl = parseFloat(pos.slPrice) || entryPremium * 0.9;
                    const tgt = parseFloat(pos.targetPrice) || entryPremium * 1.2;
                    let progress = ((currentPremium - sl) / (tgt - sl)) * 100;
                    progress = Math.max(0, Math.min(100, progress || 0));

                    // Exact break-even based on entry + calculated charges / qty
                    const beCharges = calcCharges(entryPremium, entryPremium, pos.qty || 1, true);
                    const breakEven = entryPremium + (beCharges / (pos.qty || 1));

                    // Safely extract month from expiry
                    let expiryDisplay = pos.expiry;
                    if(pos.expiry && pos.expiry.includes('-')) {
                       const parts = pos.expiry.split('-');
                       expiryDisplay = `${parts[0]} ${parts[1]}`;
                    }

                    const lotSize = lotSizes[pos.symbol] || 1;
                    const lots = pos.qty / lotSize;

                    return (
                      <div key={pos.id} className="pos-card">

                        <div className="pos-top">
                          <div>
                            <span className="pos-name">{pos.symbol || 'OPT'} {pos.strike || 0}</span>
                            <span className={`pos-badge ${pos.type === 'CE' ? 'badge-ce' : 'badge-pe'}`}>{pos.type || 'OPT'}</span>
                            <div className="pos-expiry">Expiry {expiryDisplay} · {lots} {lots > 1 ? 'lots' : 'lot'}</div>
                          </div>
                          <div className="pos-pl">
                            <div className={`amt ${isProfit ? 'pos' : 'neg'}`}>
                              {isProfit ? '+' : '−'}₹{Math.abs(runningPnL).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </div>
                            <div className={`pct ${isProfit ? '' : 'neg'}`}>
                              {isProfit ? '+' : '−'}{Math.abs(plPct).toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        <div className="progress-wrap">
                          <div className="progress-labels">
                            <span className="sl">SL {sl.toFixed(1)}</span>
                            <span>BE {breakEven.toFixed(1)}</span>
                            <span className="tgt">Target {tgt.toFixed(1)}</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill"></div>
                            <div className="progress-dot" style={{ left: `calc(${progress}% - 5.5px)` }}></div>
                          </div>
                        </div>

                        <div className="pos-meta">
                          <div className="meta-item"><div className="l">Buy Price</div><div className="v">₹{entryPremium.toFixed(2)}</div></div>
                          <div className="meta-item"><div className="l">LTP</div><div className="v">₹{currentPremium.toFixed(2)}</div></div>
                          <div className="meta-item"><div className="l">Held</div><div className="v">{getHeldTime(pos.entryTime, null)}</div></div>
                        </div>

                        <div className="entry-reason">
                          <span className="l">Entry reason:</span>
                          <span className="chip">{pos.entryReason || 'Manual'}</span>
                        </div>

                        <div className="update-row">
                          <input
                            className="price-input"
                            type="number"
                            placeholder="Enter current price"
                            value={ltpInputs[pos.id] || ''}
                            onChange={(e) => setLtpInputs({...ltpInputs, [pos.id]: e.target.value})}
                          />
                          <button className="update-btn" onClick={() => handleUpdateLTP(pos.id)}>Update</button>
                        </div>

                        <button className="exit-btn" onClick={() => setExitModalPos(pos)}>EXIT POSITION</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================= CLOSED TAB ================= */}
          {activeTab === 'closed' && (
            <div>
              <div className="stats-strip">
                <div className="stat"><div className="l">Trades Today</div><div className="v">{todayTrades.length}</div></div>
                <div className="stat"><div className="l">Win Rate</div><div className={`v ${winRate >= 50 ? 'win' : 'loss'}`}>{winRate}%</div></div>
                <div className="stat">
                  <div className="l">Net Today</div>
                  <div className={`v ${netToday >= 0 ? 'win' : 'loss'}`}>
                    {netToday >= 0 ? '+' : '−'}₹{Math.abs(netToday).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                  </div>
                </div>
              </div>

              <div className="closed-list">
                {todayTrades.length === 0 ? (
                  <div style={{textAlign:'center', padding:'30px 20px', color:'#5c6072', fontSize:'12.5px', fontWeight:'500'}}>No closed trades today.</div>
                ) : (
                  todayTrades.map(trade => {
                    const isOpen = expandedTradeId === trade.tradeId;
                    const isProfit = (trade.netPnL || 0) >= 0;
                    const entryPremium = trade.entryPremium || 0;
                    const exitPremium = trade.exitPremium || 0;
                    const chargesBreakdown = trade.chargesBreakdown || 0;

                    let closeTime = '--:--';
                    if (trade.exitTime) {
                      const d = new Date(trade.exitTime);
                      if (!isNaN(d)) closeTime = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    }

                    const lotSize = lotSizes[trade.index] || 1;
                    const lots = trade.qty / lotSize;

                    return (
                      <div key={trade.tradeId} className={`closed-row ${isOpen ? 'open' : ''}`}>
                        <div className="row-main" onClick={() => setExpandedTradeId(isOpen ? null : trade.tradeId)}>
                          <div>
                            <div className="name-row">
                              <span className="pos-name">{trade.index || 'OPT'} {trade.strike || 0}</span>
                              <span className={`pos-badge ${trade.type === 'CE' ? 'badge-ce' : 'badge-pe'}`}>{trade.type || 'OPT'}</span>
                            </div>
                            <div className="sub-row">Closed {closeTime} · {lots} {lots > 1 ? 'lots' : 'lot'}</div>
                          </div>
                          <div className="row-right">
                            <div className={`amt ${isProfit ? 'pos' : 'neg'}`}>
                              {isProfit ? '+' : '−'}₹{Math.abs(trade.netPnL || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </div>
                            <span className="chev">›</span>
                          </div>
                        </div>

                        <div className="detail">
                          <div className="detail-inner">
                            <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
                              <div className="d-item"><div className="l">Buy</div><div className="v">{entryPremium.toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Sell</div><div className="v">{exitPremium.toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Held</div><div className="v">{getHeldTime(trade.entryTime, trade.exitTime)}</div></div>
                            </div>
                            <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="d-item"><div className="l">Charges</div><div className="v" style={{color: '#ff6b6b'}}>₹{chargesBreakdown.toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Net P/L</div><div className={`v ${isProfit ? 'pos' : 'neg'}`}>{isProfit ? '+' : '−'}{Math.abs(trade.netPnL).toFixed(2)}</div></div>
                            </div>
                            <div className="reason-row">
                              <div className="reason-box">
                                <div className="l">Entry Reason</div>
                                <div className="v entry">{trade.entryReason || 'Manual'}</div>
                              </div>
                              <div className="reason-box">
                                <div className="l">Exit Reason</div>
                                <div className={`v exit ${trade.exitReason === 'Target Hit' ? 'target' : trade.exitReason === 'Stop Loss Hit' ? 'sl' : 'other'}`}>
                                  {trade.exitReason || 'Unknown'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SHEET MODAL */}
        {exitModalPos && (
          <div className="overlay" onClick={(e) => {
            if(e.target === e.currentTarget) {
              setExitModalPos(null);
              setShowCustomReason(false);
              setCustomReasonText("");
            }
          }}>
            <div className="sheet">
              <div className="sheet-title">Exit reason</div>
              <div className="sheet-sub">Why are you exiting {exitModalPos.symbol} {exitModalPos.strike} {exitModalPos.type}?</div>

              {!showCustomReason ? (
                <>
                  <button className="reason-btn" onClick={() => handleExitTrade('Stop Loss Hit')}>
                    <span>Stop Loss Hit</span><span className="arrow">›</span>
                  </button>
                  <button className="reason-btn" onClick={() => handleExitTrade('Target Hit')}>
                    <span>Target Hit</span><span className="arrow">›</span>
                  </button>
                  <button className="reason-btn" onClick={() => setShowCustomReason(true)}>
                    <span>Other Reason</span><span className="arrow">›</span>
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Type reason here..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="reason-input"
                    autoFocus
                  />
                  <button
                    className="confirm-btn"
                    onClick={() => handleExitTrade(customReasonText.trim() || 'Manual')}
                  >
                    Confirm Exit
                  </button>
                </>
              )}

              <button className="cancel-btn" onClick={() => {
                setExitModalPos(null);
                setShowCustomReason(false);
                setCustomReasonText("");
              }}>Cancel</button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
