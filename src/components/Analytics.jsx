import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Download, Calendar as CalendarIcon, X } from 'lucide-react';
import useStore from '../store/useStore';

// === HELPER FUNCTIONS ===
const formatMoney = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatK = (num) => {
  if (num === 0) return '0';
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
};
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

// Date formatter for exact Entry/Exit times
const formatDateTime = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (isNaN(d)) return '--';
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
};

export default function Analytics({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Overview State
  const [overviewPeriod, setOverviewPeriod] = useState('month'); // 'week' or 'month'
  const [overviewChargesExpanded, setOverviewChargesExpanded] = useState(false);

  // History State
  const [historyDate, setHistoryDate] = useState(new Date());

  // Journal State
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [expandedChargesId, setExpandedChargesId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [journalDateFilter, setJournalDateFilter] = useState(null);
  const [journalPeriod, setJournalPeriod] = useState('all');

  // THE FIX: Move the fallback array OUTSIDE the Zustand selector to prevent infinite loops!
  const trades = useStore(state => state.trades) || [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // === DATA PROCESSING ENGINE ===
  const stats = useMemo(() => {
    const now = new Date();

    // Overall Net
    const overallNet = trades.reduce((acc, t) => acc + (t.netPnL || 0), 0);

    // Overview Filtering
    const currMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const sevenDaysAgoStr = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const activeTrades = trades.filter(t => {
      if (!t.date) return false;
      if (overviewPeriod === 'month') return t.date.startsWith(currMonthPrefix);
      if (overviewPeriod === 'week') return t.date >= sevenDaysAgoStr;
      return true;
    });

    const activeNet = activeTrades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
    const activeGross = activeTrades.reduce((acc, t) => acc + (t.grossPnL || 0), 0);

    // Extract total charges exactly from DB
    const aggregatedCharges = { bro: 0, stt: 0, txn: 0, sebi: 0, stamp: 0, gst: 0, total: 0 };
    activeTrades.forEach(t => {
      const c = t.chargesBreakdown;
      if (c && typeof c === 'object') {
        aggregatedCharges.bro += (c.bro || 0); aggregatedCharges.stt += (c.stt || 0); aggregatedCharges.txn += (c.txn || 0);
        aggregatedCharges.sebi += (c.sebi || 0); aggregatedCharges.stamp += (c.stamp || 0); aggregatedCharges.gst += (c.gst || 0);
        aggregatedCharges.total += (c.total || 0);
      } else if (typeof c === 'number') {
        // Reverse calculate just for overview estimates
        const bro = 40;
        const gst = bro * 0.18;
        aggregatedCharges.bro += bro;
        aggregatedCharges.gst += gst;
        aggregatedCharges.total += c;
      }
    });

    const winningTrades = activeTrades.filter(t => (t.netPnL || 0) > 0);
    const losingTrades = activeTrades.filter(t => (t.netPnL || 0) <= 0);

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const totalActive = activeTrades.length;

    const winRate = totalActive > 0 ? (winCount / totalActive) * 100 : 0;

    const totalGrossWin = winningTrades.reduce((acc, t) => acc + (t.grossPnL || 0), 0);
    const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + (t.grossPnL || 0), 0));
    const profitFactor = totalGrossLoss > 0 ? (totalGrossWin / totalGrossLoss) : (totalGrossWin > 0 ? 99 : 0);

    const avgWin = winCount > 0 ? totalGrossWin / winCount : 0;
    const avgLoss = lossCount > 0 ? totalGrossLoss / lossCount : 0;
    const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Daily PnL for Overview Horizontal Cards
    const pnlByDate = {};
    activeTrades.forEach(t => {
      if (!pnlByDate[t.date]) pnlByDate[t.date] = { net: 0, wins: 0, losses: 0 };
      pnlByDate[t.date].net += (t.netPnL || 0);
      if ((t.netPnL || 0) > 0) pnlByDate[t.date].wins += 1;
      else pnlByDate[t.date].losses += 1;
    });
    const dailyCards = Object.entries(pnlByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const chargesPct = activeGross > 0 ? (aggregatedCharges.total / activeGross) * 100 : 0;
    const dashArray = (Math.min(chargesPct, 100) / 100) * 188.5;

    // === HISTORY FILTERING ===
    const hYear = historyDate.getFullYear();
    const hMonth = historyDate.getMonth();
    const historyPrefix = `${hYear}-${String(hMonth + 1).padStart(2, '0')}`;

    const historyTrades = trades.filter(t => t.date && t.date.startsWith(historyPrefix));
    const hNet = historyTrades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
    const hWins = historyTrades.filter(t => (t.netPnL || 0) > 0).length;
    const hWinRate = historyTrades.length > 0 ? (hWins / historyTrades.length) * 100 : 0;

    const historyPnlByDate = {};
    historyTrades.forEach(t => { historyPnlByDate[t.date] = (historyPnlByDate[t.date] || 0) + (t.netPnL || 0); });

    // === JOURNAL FILTERING ===
    let filteredJournal = [...trades];
    if (journalDateFilter) {
      filteredJournal = filteredJournal.filter(t => t.date === journalDateFilter);
    } else if (journalPeriod === 'month') {
      const p = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      filteredJournal = filteredJournal.filter(t => t.date && t.date.startsWith(p));
    } else if (journalPeriod === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lmPrefix = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, '0')}`;
      filteredJournal = filteredJournal.filter(t => t.date && t.date.startsWith(lmPrefix));
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filteredJournal = filteredJournal.filter(t =>
        (t.index || '').toLowerCase().includes(q) ||
        (t.entryReason || '').toLowerCase().includes(q) ||
        (t.exitReason || '').toLowerCase().includes(q) ||
        (t.lesson || '').toLowerCase().includes(q)
      );
    }

    const jNet = filteredJournal.reduce((acc, t) => acc + (t.netPnL || 0), 0);
    const jWins = filteredJournal.filter(t => (t.netPnL || 0) > 0).length;
    const jWinRate = filteredJournal.length > 0 ? (jWins / filteredJournal.length) * 100 : 0;

    return {
      now, overallNet,
      activeNet, activeGross, aggregatedCharges, winRate, winCount, lossCount, profitFactor, avgWin, avgLoss, winLossRatio, dailyCards, chargesPct, dashArray,
      hYear, hMonth, historyTrades, hNet, hWinRate, historyPnlByDate,
      filteredJournal: filteredJournal.reverse(), jNet, jWinRate
    };
  }, [trades, overviewPeriod, historyDate, journalDateFilter, journalPeriod, searchQuery]);

  // === HISTORY SWIPE LOGIC ===
  const [touchStartX, setTouchStartX] = useState(null);
  const handleHistoryTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleHistoryTouchEnd = (e) => {
    if (!touchStartX) return;
    const diffX = touchStartX - e.changedTouches[0].clientX;
    if (diffX > 50) setHistoryDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); // Swipe Left = Next Month
    else if (diffX < -50) setHistoryDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); // Swipe Right = Prev Month
    setTouchStartX(null);
  };

  // === RENDERERS ===
  const renderCalendar = () => {
    const daysInMonth = new Date(stats.hYear, stats.hMonth + 1, 0).getDate();
    const firstDay = new Date(stats.hYear, stats.hMonth, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(<div key={`e-${i}`} className="heat-cell none"></div>);

    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = `${stats.hYear}-${String(stats.hMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const pnl = stats.historyPnlByDate[dStr];

      let cls = 'heat-cell cursor-pointer transition-transform hover:scale-110 ';
      if (pnl > 0) cls += 'profit';
      else if (pnl < 0) cls += 'loss';
      else cls += 'none';

      cells.push(
        <div key={`d-${i}`} className={cls} onClick={() => { setJournalDateFilter(dStr); setActiveTab('journal'); }}>
          {i}
        </div>
      );
    }
    return cells;
  };

  // === PDF EXPORT ENGINE ===
  const generatePDFReport = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return alert("Please allow popups to generate the PDF report.");

    const generatedStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    let periodStr = "All Time";
    if (journalDateFilter) periodStr = new Date(journalDateFilter).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    else if (journalPeriod === 'month') periodStr = `${monthNames[stats.now.getMonth()]} ${stats.now.getFullYear()}`;
    else if (journalPeriod === 'last_month') periodStr = `${monthNames[(stats.now.getMonth() + 11) % 12]} ${stats.now.getFullYear() - (stats.now.getMonth() === 0 ? 1 : 0)}`;

    const tradesHtml = stats.filteredJournal.map(t => {
      const isProfit = (t.netPnL || 0) >= 0;
      const color = isProfit ? '#28a745' : '#dc3545';
      const sign = isProfit ? '+' : '−';

      const inStr = formatDateTime(t.entryTime);
      const outStr = formatDateTime(t.exitTime);
      const heldTime = getHeldTime(t.entryTime, t.exitTime);

      const note = t.lesson || t.exitNote || "";
      const noteHtml = note ? `<div style="font-style: italic; color: #555; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; margin-top:15px;">“${note}”</div>` : '';

      return `
        <div style="border: 1px solid #e0e0e0; background-color: #fbfbfb; border-radius: 6px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="font-size: 16px; font-weight: bold; color: #111;">${t.index} ${t.strike} ${t.type}</div>
                <div style="font-size: 18px; font-weight: bold; color: ${color};">${sign}${Math.abs(t.netPnL).toFixed(2)}</div>
            </div>
            <div style="color: #777; font-size: 12px; margin-bottom: 15px;">In: ${inStr} &middot; Out: ${outStr}</div>
            <table style="width: 100%; text-align: left; font-size: 12px; border-collapse: collapse;">
                <tr style="color: #888; font-size: 10px; text-transform: uppercase;">
                    <th style="padding-bottom: 8px;">Buy</th><th style="padding-bottom: 8px;">Sell</th>
                    <th style="padding-bottom: 8px;">Qty</th><th style="padding-bottom: 8px;">Held</th>
                    <th style="padding-bottom: 8px;">Entry Reason</th><th style="padding-bottom: 8px;">Exit Reason</th>
                </tr>
                <tr style="font-weight: 600; color: #222;">
                    <td>${(t.entryPremium||0).toFixed(2)}</td><td>${(t.exitPremium||0).toFixed(2)}</td>
                    <td>${t.qty}</td><td>${heldTime}</td>
                    <td>${t.entryReason || '-'}</td><td style="color: ${t.exitReason === 'Target Hit' ? '#28a745' : t.exitReason === 'Stop Loss Hit' ? '#dc3545' : '#555'};">${t.exitReason || '-'}</td>
                </tr>
            </table>
            ${noteHtml}
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html><html><head><title>OptionLab Journal - ${periodStr}</title>
      <style>body { margin: 0; font-family: -apple-system, sans-serif; color: #333; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head><body>
          <div style="background-color: #24283b; color: #ffffff; padding: 25px 40px; display: flex; justify-content: space-between; align-items: center;">
              <div><h1 style="margin: 0; font-size: 24px; font-weight: bold; display: flex; align-items: center; gap: 8px;"><span style="color: #3ddc97;">O</span>ptionLab</h1><p style="margin: 5px 0 0 0; font-size: 14px; color: #a1a5b5;">Trade Journal</p></div>
              <div style="text-align: right;"><h2 style="margin: 0; font-size: 18px; color: #3ddc97;">${periodStr}</h2><p style="margin: 5px 0 0 0; font-size: 12px; color: #a1a5b5;">Generated: ${generatedStr}</p></div>
          </div>
          <div style="padding: 40px; max-width: 900px; margin: 0 auto;">
              <h3 style="margin-top: 0; font-size: 18px; color: #111;">Journal Summary</h3>
              <p style="color: #444; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; font-size: 14px;">
                  ${stats.filteredJournal.length} trades logged &nbsp;&middot;&nbsp; Net P&L: <strong style="color: ${stats.jNet >= 0 ? '#28a745' : '#dc3545'};">${stats.jNet >= 0 ? '+' : '−'}Rs ${Math.abs(stats.jNet).toFixed(2)}</strong> &nbsp;&middot;&nbsp; Win rate: ${stats.jWinRate.toFixed(1)}%
              </p>
              <h3 style="font-size: 18px; color: #111; margin-bottom: 20px;">Trade Entries</h3>
              ${tradesHtml || '<p style="color: #888;">No trades found for this period.</p>'}
          </div>
      </body></html>
    `;
    printWin.document.write(html);
    printWin.document.close(); printWin.focus();
    setTimeout(() => printWin.print(), 250);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap');
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .analytics-wrapper { background: #0a0b12; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; height: 100vh; color: #e8e9ee; overflow: hidden; }
        .app-content { flex: 1; overflow-y: auto; padding-bottom: 90px; }

        .header { padding: 16px 22px 12px 22px; display: flex; justify-content: space-between; align-items: center; }
        .title { color: #e8e9ee; font-size: 19px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .title svg { stroke: #3ddc97; }

        .tabs { display: flex; gap: 6px; margin: 4px 22px 0 22px; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 10px; }
        .tab { flex: 1; text-align: center; padding: 8px 0; border-radius: 7px; font-size: 11px; font-weight: 600; color: #6e7284; cursor: pointer; transition: all 0.2s;}
        .tab.active { background: rgba(255,255,255,0.06); color: #3ddc97; }

        /* Overview Specifics */
        .pl-row { display: flex; gap: 10px; margin: 16px 22px 0 22px; }
        .pl-card { flex: 1; border-radius: 16px; padding: 16px 16px; position: relative; overflow: hidden;}
        .pl-card.overall { background: linear-gradient(145deg, #1a2a22, #191b26); border: 1px solid rgba(61,220,151,0.15); }
        .pl-card.period { background: #191b26; border: 1px solid rgba(255,255,255,0.05); }
        .pl-label { color: #8ea89b; font-size: 10px; font-weight: 600; text-transform: uppercase;}
        .pl-card.period .pl-label { color: #6e7284; }
        .pl-val { font-family: 'JetBrains Mono', monospace; font-size: 19px; font-weight: 800; color: #3ddc97; margin-top: 6px; }
        .pl-val.neg { color: #ff6b6b; }
        .pl-delta { color: #6fce9e; font-size: 10px; font-weight: 600; margin-top: 4px; }

        .toggle-switch { display: flex; background: rgba(255,255,255,0.04); border-radius: 6px; padding: 2px; width: fit-content; margin-top: 8px; }
        .toggle-opt { padding: 4px 10px; font-size: 9px; font-weight: 700; color: #6e7284; cursor: pointer; border-radius: 4px; text-transform: uppercase; transition: all 0.2s;}
        .toggle-opt.active { background: rgba(255,255,255,0.1); color: #fff; }

        .diag-row { display: flex; gap: 10px; margin: 14px 22px 0 22px; }
        .diag-card { flex: 1; background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 11px 10px; text-align: center; }
        .diag-card .l { color: #6e7284; font-size: 9px; font-weight: 600; text-transform: uppercase;}
        .diag-card .v { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #d5d7e0; margin-top: 5px; }
        .diag-card .v.pos { color: #3ddc97; } .diag-card .v.neg { color: #ff6b6b; }
        .diag-card .tag { font-size: 8.5px; color: #5c6072; margin-top: 2px; }

        .section { margin: 16px 22px 0 22px; background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 16px; }
        .section-title { color: #d5d7e0; font-size: 13px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }

        .charge-row { display: flex; align-items: center; gap: 14px; }
        .charge-legend .amt { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; color: #ff9c6b; }
        .charge-legend .sub { color: #6e7284; font-size: 10.5px; margin-top: 3px; line-height: 1.4; }

        /* History Grid */
        .heat-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 10px; }
        .heat-dow { color: #5c6072; font-size: 9px; text-align: center; font-weight: 600; margin-bottom: 4px;}
        .heat-cell { aspect-ratio: 1; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; }
        .heat-cell.profit { background: rgba(61,220,151,0.22); color: #3ddc97; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;}
        .heat-cell.loss { background: rgba(255,107,107,0.2); color: #ff6b6b; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;}
        .heat-cell.none { background: rgba(255,255,255,0.03); color: #3a3f52; }

        /* Journal */
        .journal-toolbar { display: flex; flex-direction: column; gap: 8px; padding: 16px 22px 0 22px; }
        .journal-select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9px; padding: 9px 12px; color: #cfd2dc; font-size: 12px; font-weight: 600; outline: none; }

        .journal-list { padding: 12px 22px 40px 22px; display: flex; flex-direction: column; gap: 10px; }
        .jcard { background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: background 0.2s; overflow: hidden; }
        .jcard:active { background: #232635; }
        .jcard.sl { border-left-color: #ff6b6b; }
        .jcard.manual { border-left-color: #f5c542; }

        .row-main { display: flex; justify-content: space-between; align-items: center; padding: 14px; }
        .name-row { display: flex; align-items: center; }
        .pos-name { color: #d5d7e0; font-size: 14px; font-weight: 700; }
        .pos-badge { display: inline-block; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 5px; margin-left: 6px; vertical-align: middle; }
        .badge-ce { background: rgba(61,220,151,0.16); color: #3ddc97; }
        .badge-pe { background: rgba(255,107,107,0.16); color: #ff6b6b; }
        .sub-row { color: #6e7284; font-size: 10px; margin-top: 4px; font-weight: 500;}
        .row-right { display: flex; align-items: center; gap: 8px; }
        .jcard-pnl { font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 800; text-align: right; }
        .jcard-pnl.pos { color: #3ddc97; } .jcard-pnl.neg { color: #ff6b6b; }
        .chev { color: #5c6072; font-size: 15px; font-weight: 600; transition: transform 0.2s ease; }

        /* Grid expansions */
        .detail-inner { padding: 0 14px 14px 14px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px 6px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px 10px 0 0; border-bottom: none; padding: 10px 0; }
        .detail-grid-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 6px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); border-radius: 0 0 10px 10px; padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.05);}
        .d-item { text-align: center; position: relative; }
        .d-item:not(:last-child)::after { content: ""; position: absolute; right: 0; top: 2px; bottom: 2px; width: 1px; background: rgba(255,255,255,0.06); }
        .d-item .l { color: #5c6072; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .d-item .v { color: #cfd2dc; font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
        .d-item .v.charges { color: #ffb74d; }

        .reason-row { display: flex; gap: 8px; margin-top: 10px; }
        .reason-box { flex: 1; text-align: center; padding: 8px 4px; border-radius: 8px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.05); }
        .reason-box .l { color: #5c6072; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        .reason-box .v { font-size: 11px; font-weight: 700; margin-top: 4px; }
        .reason-box .v.entry { color: #9598a8; }
        .reason-box .v.exit.target { color: #3ddc97; }
        .reason-box .v.exit.sl { color: #ff6b6b; }
        .reason-box .v.exit.other { color: #9598a8; }
      `}</style>

      <div className="analytics-wrapper sm:max-w-md sm:mx-auto relative">

        {/* HEADER */}
        <div className="header">
          <div className="title">
            <ArrowLeft onClick={onBack} className="w-5 h-5 text-white cursor-pointer hover:text-[#3ddc97] transition-colors" />
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>
            Analytics
          </div>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</div>
          <div className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</div>
          <div className={`tab ${activeTab === 'journal' ? 'active' : ''}`} onClick={() => setActiveTab('journal')}>Journal</div>
        </div>

        <div className="app-content hide-scrollbar animate-in fade-in duration-200">

          {/* ===================== OVERVIEW ===================== */}
          {activeTab === 'overview' && (
            <div>
              <div className="pl-row">
                <div className="pl-card overall">
                  <div className="pl-label">OVERALL P&amp;L</div>
                  <div className={`pl-val ${stats.overallNet < 0 ? 'neg' : ''}`}>
                    {stats.overallNet >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(stats.overallNet))}
                  </div>
                  <div className="pl-delta">Since inception</div>
                </div>
                <div className="pl-card period">
                  <div className="flex justify-between items-start">
                    <div className="pl-label">SELECTED PERIOD</div>
                  </div>
                  <div className="pl-val" style={{ color: stats.activeNet < 0 ? '#ff6b6b' : '#d5d7e0' }}>
                    {stats.activeNet >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(stats.activeNet))}
                  </div>
                  <div className="toggle-switch">
                    <div className={`toggle-opt ${overviewPeriod === 'week' ? 'active' : ''}`} onClick={() => setOverviewPeriod('week')}>7 Days</div>
                    <div className={`toggle-opt ${overviewPeriod === 'month' ? 'active' : ''}`} onClick={() => setOverviewPeriod('month')}>Month</div>
                  </div>
                </div>
              </div>

              <div className="diag-row">
                <div className="diag-card"><div className="l">WIN RATE</div><div className="v">{stats.winRate.toFixed(1)}%</div><div className="tag">{stats.winCount}W / {stats.lossCount}L</div></div>
                <div className="diag-card"><div className="l">PROFIT FACTOR</div><div className={`v ${stats.profitFactor > 1 ? 'pos' : 'neg'}`}>{stats.profitFactor.toFixed(2)}</div><div className="tag">{stats.profitFactor > 1.5 ? 'Good' : stats.profitFactor < 1 ? 'Poor' : 'Avg'}</div></div>
                <div className="diag-card"><div className="l">WIN:LOSS RATIO</div><div className={`v ${stats.winLossRatio > 1 ? 'pos' : 'neg'}`}>{stats.winLossRatio.toFixed(2)}x</div><div className="tag">₹{formatK(stats.avgWin)} / ₹{formatK(stats.avgLoss)}</div></div>
              </div>

              {/* DAILY P&L SUMMARY CARDS */}
              <div className="section !bg-transparent !border-none !p-0">
                <div className="section-title px-2">Daily Summary <span className="text-[#6e7284] font-normal text-[10px] ml-2">({overviewPeriod})</span></div>
                {stats.dailyCards.length === 0 ? (
                  <div className="text-center text-[#6e7284] text-xs py-4 bg-[#191b26] rounded-xl border border-white/5 mx-2">No trades in this period</div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-2">
                    {stats.dailyCards.map(d => {
                      const dateObj = new Date(d.date);
                      const displayDate = `${String(dateObj.getDate()).padStart(2, '0')} ${monthNames[dateObj.getMonth()]}`;
                      return (
                        <div key={d.date} className="min-w-[110px] bg-[#191b26] border border-white/5 rounded-xl p-3 shrink-0 flex flex-col items-center shadow-sm">
                          <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider">{displayDate}</div>
                          <div className={`font-mono font-bold text-base mt-1.5 ${d.net >= 0 ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>
                            {d.net >= 0 ? '+' : '−'}₹{formatK(Math.abs(d.net))}
                          </div>
                          <div className="text-[#9598a8] text-[9.5px] font-bold mt-1.5 bg-white/5 px-2 py-0.5 rounded">{d.wins}W / {d.losses}L</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CHARGES VS PROFIT ACCORDION */}
              <div className="section">
                <div className="section-title">Charges vs Profit</div>
                <div
                  className="charge-row cursor-pointer group"
                  onClick={() => setOverviewChargesExpanded(!overviewChargesExpanded)}
                >
                  <svg width="68" height="68" viewBox="0 0 76 76" className="shrink-0 transition-transform group-active:scale-95">
                    <circle cx="38" cy="38" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11"/>
                    <circle cx="38" cy="38" r="30" fill="none" stroke="#ffb74d" strokeWidth="11" strokeDasharray={`${stats.dashArray} 188.5`} strokeLinecap="round" transform="rotate(-90 38 38)"/>
                  </svg>
                  <div className="charge-legend flex-1">
                    <div className="flex justify-between items-center">
                      <div className="amt text-[#ffb74d]">₹{formatMoney(stats.aggregatedCharges.total)}</div>
                      <ChevronDown className={`w-4 h-4 text-[#6e7284] transition-transform ${overviewChargesExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="sub">{stats.chargesPct.toFixed(1)}% of gross profit went to fees this {overviewPeriod}.</div>
                  </div>
                </div>

                {overviewChargesExpanded && (
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2">
                    <div className="flex justify-between text-[11px] font-mono"><span className="text-[#6e7284] font-sans font-medium">Brokerage</span><span className="text-white/90 font-bold">₹{stats.aggregatedCharges.bro.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[11px] font-mono"><span className="text-[#6e7284] font-sans font-medium">STT / CTT</span><span className="text-white/90 font-bold">₹{stats.aggregatedCharges.stt.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[11px] font-mono"><span className="text-[#6e7284] font-sans font-medium">Exchange Txn</span><span className="text-white/90 font-bold">₹{stats.aggregatedCharges.txn.toFixed(2)}</span></div>
                    <div className="flex justify-between text-[11px] font-mono"><span className="text-[#6e7284] font-sans font-medium">SEBI / Stamp</span><span className="text-white/90 font-bold">₹{(stats.aggregatedCharges.sebi + stats.aggregatedCharges.stamp).toFixed(2)}</span></div>
                    <div className="flex justify-between text-[11px] font-mono"><span className="text-[#6e7284] font-sans font-medium">GST (18%)</span><span className="text-white/90 font-bold">₹{stats.aggregatedCharges.gst.toFixed(2)}</span></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== HISTORY ===================== */}
          {activeTab === 'history' && (
            <div
              className="animate-in fade-in duration-200 h-full"
              onTouchStart={handleHistoryTouchStart}
              onTouchEnd={handleHistoryTouchEnd}
            >

              <div className="flex justify-between items-center px-6 py-4 mt-2">
                <button onClick={() => setHistoryDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 bg-white/5 rounded-full text-[#828b9d] active:bg-white/10"><ArrowLeft size={16} /></button>
                <div className="text-white font-bold text-lg">{monthNames[stats.hMonth]} {stats.hYear}</div>
                <button onClick={() => setHistoryDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 bg-white/5 rounded-full text-[#828b9d] active:bg-white/10"><ChevronRight size={16} /></button>
              </div>

              {/* Month Summary KPI */}
              <div className="grid grid-cols-3 gap-3 mx-5 mb-4">
                <div className="bg-[#191b26] border border-white/5 p-3 rounded-xl text-center shadow-sm">
                   <div className="text-[#6e7284] text-[9px] font-bold uppercase tracking-wider mb-1">Trades</div>
                   <div className="text-white font-mono font-bold text-sm">{stats.historyTrades.length}</div>
                </div>
                <div className="bg-[#191b26] border border-white/5 p-3 rounded-xl text-center shadow-sm">
                   <div className="text-[#6e7284] text-[9px] font-bold uppercase tracking-wider mb-1">Win Rate</div>
                   <div className="text-white font-mono font-bold text-sm">{stats.hWinRate.toFixed(0)}%</div>
                </div>
                <div className="bg-[#191b26] border border-white/5 p-3 rounded-xl text-center shadow-sm">
                   <div className="text-[#6e7284] text-[9px] font-bold uppercase tracking-wider mb-1">Net P&L</div>
                   <div className={`font-mono font-bold text-sm ${stats.hNet >= 0 ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>{stats.hNet >= 0 ? '+' : '−'}₹{formatK(Math.abs(stats.hNet))}</div>
                </div>
              </div>

              <div className="section mx-5">
                <div className="section-title justify-center text-sm">P&L Calendar</div>
                <div className="heat-grid">
                  {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} className="heat-dow">{d}</div>)}
                  {renderCalendar()}
                </div>
                <div className="flex items-center justify-center gap-5 mt-5 pb-2">
                  <div className="flex items-center text-[10px] font-semibold text-[#6e7284]"><div className="w-2.5 h-2.5 rounded-sm bg-[#3ddc97] mr-1.5 opacity-80"></div>Profit</div>
                  <div className="flex items-center text-[10px] font-semibold text-[#6e7284]"><div className="w-2.5 h-2.5 rounded-sm bg-[#ff6b6b] mr-1.5 opacity-80"></div>Loss</div>
                </div>
              </div>

              <div className="text-center text-[#5c6072] text-[10px] mt-6 font-medium tracking-wide">Swipe left or right to navigate months</div>
            </div>
          )}

          {/* ===================== JOURNAL ===================== */}
          {activeTab === 'journal' && (
            <div className="animate-in fade-in duration-200">
              <div className="journal-toolbar">
                {journalDateFilter && (
                  <div className="flex items-center justify-between bg-[#3ddc97]/10 border border-[#3ddc97]/30 px-3 py-2.5 rounded-lg w-full mb-1">
                    <div className="flex items-center gap-2 text-[#3ddc97] text-[11px] font-bold tracking-wide uppercase">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Showing exact date: {new Date(journalDateFilter).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric'})}
                    </div>
                    <X onClick={() => setJournalDateFilter(null)} className="w-4 h-4 text-[#3ddc97] cursor-pointer" />
                  </div>
                )}

                <div className="flex gap-2 w-full">
                  <select
                    value={journalPeriod}
                    onChange={(e) => { setJournalPeriod(e.target.value); setJournalDateFilter(null); }}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] text-[#cfd2dc] font-bold uppercase tracking-wider focus:outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="last_month">Last Month</option>
                  </select>
                  <input
                    type="text"
                    className="journal-select"
                    placeholder="Search strategy, index..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button onClick={generatePDFReport} className="w-[42px] h-[40px] rounded-lg bg-[#3ddc97]/10 border border-[#3ddc97]/30 flex items-center justify-center text-[#3ddc97] shrink-0" title="Export PDF">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Dynamic Summary Card (Only shows if filtered) */}
              {(journalDateFilter !== null || journalPeriod !== 'all') && (
                 <div className="mx-[22px] mt-4 p-4 bg-[#191b26] border border-white/5 rounded-xl flex justify-between items-center shadow-sm">
                   <div>
                     <div className="text-[#6e7284] text-[10px] font-bold uppercase tracking-wider mb-1">Filtered Summary</div>
                     <div className="text-white text-xs font-bold">{stats.filteredJournal.length} Trades • {stats.jWinRate.toFixed(0)}% Win Rate</div>
                   </div>
                   <div className={`font-mono font-bold text-lg ${stats.jNet >= 0 ? 'text-[#3ddc97]' : 'text-[#ff6b6b]'}`}>
                     {stats.jNet >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(stats.jNet))}
                   </div>
                 </div>
              )}

              <div className="journal-list">
                {stats.filteredJournal.length === 0 ? (
                   <div className="text-center py-10 text-[#6e7284] text-xs font-medium">No trades found matching criteria.</div>
                ) : (
                  stats.filteredJournal.map(trade => {
                    const isOpen = expandedTradeId === trade.tradeId;
                    const isChargesOpen = expandedChargesId === trade.tradeId;
                    const isProfit = (trade.netPnL || 0) >= 0;

                    const heldTime = getHeldTime(trade.entryTime, trade.exitTime);
                    const entryDisplay = formatDateTime(trade.entryTime);
                    const exitDisplay = formatDateTime(trade.exitTime);

                    // Exact Charges Breakdown logic: Rebuild on-the-fly for legacy numbers!
                    let cObj = trade.chargesBreakdown;
                    if (typeof cObj !== 'object' || cObj === null) {
                      const buyTO = (trade.entryPremium || 0) * (trade.qty || 0);
                      const sellTO = (trade.exitPremium || 0) * (trade.qty || 0);
                      const totalTO = buyTO + sellTO;
                      const bro = 40;
                      const stt = (sellTO * 0.0015);
                      const txn = (totalTO * 0.0003503);
                      const sebi = (totalTO * 0.000001);
                      const stamp = (buyTO * 0.00003);
                      const gst = ((bro + txn + sebi) * 0.18);
                      const total = trade.chargesBreakdown || (bro + stt + txn + sebi + stamp + gst);
                      cObj = { bro, stt, txn, sebi, stamp, gst, total };
                    }

                    let statusCls = 'manual';
                    let statusBadgeCls = 'bg-[#f5c542]/10 text-[#f5c542]';

                    if (trade.exitReason === 'Target Hit') {
                      statusCls = 'target';
                      statusBadgeCls = 'bg-[#3ddc97]/10 text-[#3ddc97]';
                    } else if (trade.exitReason === 'Stop Loss Hit') {
                      statusCls = 'sl';
                      statusBadgeCls = 'bg-[#ff6b6b]/10 text-[#ff6b6b]';
                    } else {
                      statusCls = 'other';
                    }

                    return (
                      <div key={trade.tradeId} className="jcard" onClick={() => setExpandedTradeId(isOpen ? null : trade.tradeId)}>
                        <div className="row-main">
                          <div>
                            <div className="name-row">
                              <span className="pos-name">{trade.index || 'OPT'} {trade.strike || 0}</span>
                              <span className={`pos-badge ${trade.type === 'CE' ? 'badge-ce' : 'badge-pe'}`}>{trade.type || 'OPT'}</span>
                              <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded font-bold ${statusBadgeCls}`}>{trade.exitReason || 'Manual'}</span>
                            </div>
                            <div className="sub-row">In: {entryDisplay} • Out: {exitDisplay}</div>
                          </div>
                          <div className="row-right">
                            <div className={`jcard-pnl ${isProfit ? 'pos' : 'neg'}`}>
                              {isProfit ? '+' : '−'}₹{Math.abs(trade.netPnL || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                            </div>
                            <ChevronRight className={`chev ${isOpen ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Collapsible Details */}
                        {isOpen && (
                          <div className="detail-inner animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                            <div className="detail-grid">
                              <div className="d-item"><div className="l">Buy</div><div className="v">{(trade.entryPremium || 0).toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Sell</div><div className="v">{(trade.exitPremium || 0).toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Held</div><div className="v">{heldTime}</div></div>
                            </div>
                            <div className="detail-grid-bottom">
                              <div className="d-item"><div className="l">Charges</div><div className="v charges">₹{(cObj.total || 0).toFixed(2)}</div></div>
                              <div className="d-item"><div className="l">Net P/L</div><div className={`v ${isProfit ? 'pos' : 'neg'}`}>{isProfit ? '+' : '−'}{Math.abs(trade.netPnL).toFixed(2)}</div></div>
                            </div>
                            <div className="reason-row">
                              <div className="reason-box">
                                <div className="l">Entry Reason</div>
                                <div className="v entry">{trade.entryReason || 'Manual'}</div>
                              </div>
                              <div className="reason-box">
                                <div className="l">Exit Reason</div>
                                <div className={`v exit ${statusCls}`}>
                                  {trade.exitReason || 'Unknown'}
                                </div>
                              </div>
                            </div>

                            {/* Show Missed Targets for Losing Trades */}
                            {!isProfit && trade.slPrice && trade.targetPrice && (
                              <div className="mt-3 flex justify-between items-center bg-[#14161f] border border-[#252b3d] rounded-lg p-2.5">
                                <div className="flex-1 text-center">
                                  <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Initial SL</div>
                                  <div className="text-[#ff6b6b] text-xs font-mono font-bold mt-1">₹{parseFloat(trade.slPrice).toFixed(2)}</div>
                                </div>
                                <div className="w-[1px] h-6 bg-[#252b3d]"></div>
                                <div className="flex-1 text-center">
                                  <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide">Missed Target</div>
                                  <div className="text-[#3ddc97] text-xs font-mono font-bold mt-1">₹{parseFloat(trade.targetPrice).toFixed(2)}</div>
                                </div>
                              </div>
                            )}

                            {/* Custom Note / Reflection */}
                            {(trade.lesson || trade.exitNote) && (
                              <div className="mt-3 bg-[#14161f] border border-[#252b3d] rounded-lg p-3">
                                <div className="text-[#5c6072] text-[9px] font-bold uppercase tracking-wide mb-1.5">Trade Lesson / Mistake</div>
                                <div className="text-[#d5d7e0] text-xs font-medium leading-relaxed italic">"{trade.lesson || trade.exitNote}"</div>
                              </div>
                            )}

                            {/* Detailed Charges Dropdown */}
                            <div className="bg-[#10121a] border border-[#252b3d] rounded-lg overflow-hidden mt-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedChargesId(isChargesOpen ? null : trade.tradeId); }}
                                className="w-full flex justify-between items-center p-3 focus:outline-none hover:bg-white/5"
                              >
                                <span className="text-[11px] font-bold text-[#d5d7e0]">View Complete Charge Breakdown</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-[#6e7284] transition-transform ${isChargesOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isChargesOpen && (
                                <div className="px-4 pb-3 pt-1 border-t border-[#252b3d] space-y-1.5 bg-[#0a0b12]">
                                  <div className="flex justify-between text-[10px] font-mono"><span className="text-[#6e7284] font-sans">Brokerage</span><span className="text-white/80">₹{cObj.bro.toFixed(2)}</span></div>
                                  <div className="flex justify-between text-[10px] font-mono"><span className="text-[#6e7284] font-sans">STT / CTT</span><span className="text-white/80">₹{cObj.stt.toFixed(2)}</span></div>
                                  <div className="flex justify-between text-[10px] font-mono"><span className="text-[#6e7284] font-sans">Exchange Txn</span><span className="text-white/80">₹{cObj.txn.toFixed(2)}</span></div>
                                  <div className="flex justify-between text-[10px] font-mono"><span className="text-[#6e7284] font-sans">SEBI / Stamp</span><span className="text-white/80">₹{(cObj.sebi + cObj.stamp).toFixed(2)}</span></div>
                                  <div className="flex justify-between text-[10px] font-mono"><span className="text-[#6e7284] font-sans">GST (18%)</span><span className="text-white/80">₹{cObj.gst.toFixed(2)}</span></div>
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
            </div>
          )}

        </div>
      </div>
    </>
  );
}
