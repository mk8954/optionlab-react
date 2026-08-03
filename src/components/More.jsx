import React, { useState, useRef, useEffect } from 'react';
import { Home, Briefcase, ArrowLeftRight, BarChart2, MoreHorizontal, FileText, Settings, PlusCircle, Sliders, Download, Info, Trash2, CheckCircle2, ChevronRight, UploadCloud } from 'lucide-react';
import useStore from '../store/useStore';

const formatMoney = (val) => val.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const initials = (name) => name.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
const formatDate = (dateString) => {
  if (dateString === 'Today') return 'Today';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function More({ onNavigateToHome, onNavigateToPositions, onNavigateToTrade, onNavigateToAnalytics }) {
  const [activeSheet, setActiveSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const fileInputRef = useRef(null);

  const profileName = useStore(state => state.profileName);
  const wallet = useStore(state => state.wallet) || { availableCash: 0, investedMargin: 0 };
  const trades = useStore(state => state.trades) || [];
  const statement = useStore(state => state.statement) || [];
  const settings = useStore(state => state.settings) || {};
  const stateSnapshot = useStore(state => state);

  const setProfileName = useStore(state => state.setProfileName);
  const addTransaction = useStore(state => state.addTransaction);
  const resetApp = useStore(state => state.resetApp);
  const updateChargeRates = useStore(state => state.updateChargeRates);
  const updateDefaultTrade = useStore(state => state.updateDefaultTrade);
  const saveIndexConfig = useStore(state => state.saveIndexConfig);

  const [editName, setEditName] = useState(profileName);
  const [moneyMode, setMoneyMode] = useState('deposit');
  const [moneyAmount, setMoneyAmount] = useState('');
  const [moneyNote, setMoneyNote] = useState('');
  const [chargeForm, setChargeForm] = useState(settings.chargeRates || {});
  const [confirmReset, setConfirmReset] = useState(false);
  const [defaultForm, setDefaultForm] = useState(settings.defaultTrade || { lotSize: 1, targetPct: 30, slPct: 20 });

  // Index Manager State (Now with Category & Timing)
  const allIndicesList = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY', ...(settings.customIndices || []).map(i => i.name)];
  const [manageIdx, setManageIdx] = useState(allIndicesList[0]);

  const [idxForm, setIdxForm] = useState({
    name: '',
    lotSize: 25,
    stepSize: 50,
    expiryFreq: 'Weekly',
    expiryDay: 'Thursday',
    type: 'Equity Index',
    timing: '09:15 - 15:30'
  });

  // Populate Index Editor when changing selection
  useEffect(() => {
    if (manageIdx === 'NEW') {
      setIdxForm({
        name: '', lotSize: '', stepSize: '', expiryFreq: 'Weekly', expiryDay: 'Thursday',
        type: 'Commodity', timing: '09:00 - 23:30'
      });
    } else if (manageIdx) {
      // Intelligent defaults for base indices if not previously saved
      const isBase = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'MIDCPNIFTY'].includes(manageIdx);
      const defType = isBase ? (manageIdx === 'SENSEX' ? 'BSE Index' : 'Equity Index') : 'Commodity';
      const defTiming = isBase ? '09:15 - 15:30' : '09:00 - 23:30';

      setIdxForm({
        name: manageIdx,
        lotSize: settings.lotSizes?.[manageIdx] || 25,
        stepSize: settings.stepSizes?.[manageIdx] || 50,
        expiryFreq: settings.expiryRules?.[manageIdx]?.type || 'Weekly',
        expiryDay: settings.expiryRules?.[manageIdx]?.day || 'Thursday',
        type: settings.indexTypes?.[manageIdx] || defType,
        timing: settings.tradingHours?.[manageIdx] || defTiming
      });
    }
  }, [manageIdx, settings]);

  const tradingPL = trades.reduce((acc, t) => acc + (t.netPnL || 0), 0);
  const deposits = statement.filter(s => s.type === 'deposit').reduce((acc, s) => acc + s.amount, 0);
  const withdrawals = statement.filter(s => s.type === 'withdraw').reduce((acc, s) => acc + s.amount, 0);

  const currentTotalAssets = wallet.availableCash + wallet.investedMargin;
  const netCashInserted = deposits - withdrawals;
  const actualPL = currentTotalAssets - netCashInserted;

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  const openMoneySheet = (mode) => { setMoneyMode(mode); setMoneyAmount(''); setMoneyNote(''); setActiveSheet('money'); };

  const handleConfirmMoney = () => {
    if (!moneyAmount || Number(moneyAmount) <= 0) return showToast('Enter a valid amount');
    if (moneyMode === 'withdraw' && Number(moneyAmount) > wallet.availableCash) return showToast('Insufficient cash');
    addTransaction(moneyMode, moneyAmount, moneyNote);
    setActiveSheet(null);
    showToast(moneyMode === 'deposit' ? 'Money added successfully' : 'Money withdrawn successfully');
  };

  const handleSaveCharges = () => {
    updateChargeRates({
      brokerage: Number(chargeForm.brokerage), stt: Number(chargeForm.stt), txn: Number(chargeForm.txn),
      sebi: Number(chargeForm.sebi), stamp: Number(chargeForm.stamp), gst: Number(chargeForm.gst)
    });
    setActiveSheet(null); showToast('Charge rates updated');
  };

  const handleSaveDefaults = () => {
    updateDefaultTrade({
      lotSize: Number(defaultForm.lotSize),
      targetPct: Number(defaultForm.targetPct),
      slPct: Number(defaultForm.slPct)
    });
    setActiveSheet(null); showToast('Default trade settings saved');
  };

  const handleSaveIndex = () => {
    const targetName = manageIdx === 'NEW' ? idxForm.name.trim() : manageIdx;
    if (!targetName) return showToast('Please enter an index name');
    if (!idxForm.lotSize || !idxForm.stepSize) return showToast('Please fill all details');

    saveIndexConfig(targetName, idxForm);
    setActiveSheet(null);
    showToast(`${targetName} configured successfully`);
  };

  const handleReset = () => {
    if (!confirmReset) return showToast('Please confirm the checkbox first');
    resetApp(); setConfirmReset(false); setActiveSheet(null); showToast('App reset to defaults');
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(stateSnapshot, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `optionlab-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Backup downloaded');
  };

  const handleExportStatement = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return alert("Please allow popups to generate the PDF statement.");

    const generatedStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statementHtml = [...statement].reverse().map(s => {
      const color = s.type === 'deposit' ? '#28a745' : '#dc3545';
      const sign = s.type === 'deposit' ? '+' : '−';
      const title = s.type === 'deposit' ? 'Money Added' : 'Money Withdrawn';
      return `
        <div style="border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 14px; font-weight: bold; color: #111;">${title}</div>
              <div style="color: #777; font-size: 12px; margin-top: 4px;">${formatDate(s.date)} ${s.note ? `&middot; ${s.note}` : ''}</div>
            </div>
            <div style="font-size: 16px; font-weight: bold; color: ${color}; font-family: monospace;">${sign}Rs ${formatMoney(s.amount)}</div>
        </div>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html><html><head><title>OptionLab Statement</title>
      <style>body { margin: 0; font-family: -apple-system, sans-serif; color: #333; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style>
      </head><body>
          <div style="background-color: #24283b; color: #ffffff; padding: 25px 40px; display: flex; justify-content: space-between; align-items: center;">
              <div><h1 style="margin: 0; font-size: 24px; font-weight: bold; display: flex; align-items: center; gap: 8px;"><span style="color: #3ddc97;">O</span>ptionLab</h1><p style="margin: 5px 0 0 0; font-size: 14px; color: #a1a5b5;">Wallet Statement</p></div>
              <div style="text-align: right;"><h2 style="margin: 0; font-size: 18px; color: #3ddc97;">Net: Rs ${formatMoney(deposits - withdrawals)}</h2><p style="margin: 5px 0 0 0; font-size: 12px; color: #a1a5b5;">Generated: ${generatedStr}</p></div>
          </div>
          <div style="padding: 40px; max-width: 800px; margin: 0 auto;">
              <h3 style="margin-top: 0; font-size: 18px; color: #111;">Transaction History</h3>
              <div style="border-top: 2px solid #333; margin-top: 15px;">
                ${statementHtml || '<p style="color: #888; margin-top: 15px;">No transactions found.</p>'}
              </div>
          </div>
      </body></html>
    `;
    printWin.document.write(html);
    printWin.document.close(); printWin.focus();
    setTimeout(() => printWin.print(), 250);
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if(imported.wallet && imported.settings) {
          useStore.setState(imported, true);
          showToast('Data restored successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else throw new Error();
      } catch (err) {
        showToast('Invalid backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .more-wrapper { background: #0a0b12; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; height: 100vh; position: relative; }
        .scroll-area { flex: 1; overflow-y: auto; padding-bottom: 90px; }

        .header { padding: 20px 22px 14px 22px; }
        .title { color: #e8e9ee; font-size: 19px; font-weight: 700; }

        .profile-card { margin: 4px 22px 0 22px; background: linear-gradient(145deg, #1a2a22, #191b26); border: 1px solid rgba(61,220,151,0.15); border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px; }
        .avatar { width: 46px; height: 46px; border-radius: 50%; background: rgba(61,220,151,0.16); color: #3ddc97; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; flex-shrink: 0; }
        .profile-text { flex: 1; min-width: 0; }
        .profile-name { color: #e8e9ee; font-size: 14.5px; font-weight: 700; }
        .profile-sub { color: #6e7284; font-size: 10.5px; margin-top: 2px; }
        .edit-link { color: #3ddc97; font-size: 11px; font-weight: 700; cursor: pointer; flex-shrink: 0; }

        .balance-card { margin: 14px 22px 0 22px; background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 18px 20px; }
        .balance-label { color: #8ea89b; font-size: 10.5px; font-weight: 600; }
        .balance-val { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 800; color: #3ddc97; margin-top: 6px; }
        .balance-sub { color: #6e7284; font-size: 10.5px; margin-top: 4px; }
        .balance-actions { display: flex; gap: 10px; margin-top: 14px; }
        .bal-btn { flex: 1; text-align: center; padding: 10px 0; border-radius: 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
        .bal-btn:active { opacity: 0.8; }
        .bal-btn.add { background: rgba(61,220,151,0.14); border: 1px solid rgba(61,220,151,0.3); color: #3ddc97; }
        .bal-btn.withdraw { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #cfd2dc; }

        .pl-twin { display: flex; gap: 10px; margin: 14px 22px 0 22px; }
        .pl-mini { flex: 1; background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; padding: 13px 14px; }
        .pl-mini .l { color: #6e7284; font-size: 9.5px; font-weight: 600; }
        .pl-mini .v { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #3ddc97; margin-top: 5px; }
        .pl-mini .v.neg { color: #ff6b6b; }
        .pl-mini .s { color: #5c6072; font-size: 8.5px; margin-top: 3px; line-height: 1.4; }

        .group-label { color: #5c6072; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin: 24px 22px 8px 22px; }
        .menu-section { margin: 0 22px; background: #191b26; border: 1px solid rgba(255,255,255,0.05); border-radius: 14px; overflow: hidden; }
        .menu-row { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-bottom: 1px solid rgba(255,255,255,0.045); cursor: pointer; transition: background 0.2s; }
        .menu-row:active { background: #232635; }
        .menu-row:last-child { border-bottom: none; }
        .menu-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .menu-icon.mint { background: rgba(61,220,151,0.12); color: #3ddc97; }
        .menu-icon.orange { background: rgba(255,156,107,0.12); color: #ff9c6b; }
        .menu-icon.blue { background: rgba(90,160,255,0.12); color: #5aa0ff; }
        .menu-icon.grey { background: rgba(255,255,255,0.06); color: #9598a8; }
        .menu-icon.red { background: rgba(255,107,107,0.12); color: #ff6b6b; }
        .menu-text { flex: 1; min-width: 0; }
        .menu-t { color: #d5d7e0; font-size: 12.5px; font-weight: 600; }
        .menu-s { color: #6e7284; font-size: 10px; margin-top: 2px; }
        .menu-chev { color: #5c6072; font-size: 13px; flex-shrink: 0; }

        .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(2px); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
        .sheet { width: 100%; max-height: 88%; overflow-y: auto; background: #181a24; border-radius: 18px 18px 0 0; padding: 20px 22px 26px 22px; border: 1px solid rgba(255,255,255,0.06); border-bottom: none; animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        .sheet-title { color: #e8e9ee; font-size: 15px; font-weight: 700; margin-bottom: 3px; }
        .sheet-sub { color: #6e7284; font-size: 11px; margin-bottom: 16px; }
        .field-label { color: #9598a8; font-size: 11px; font-weight: 600; margin: 12px 0 6px 0; }
        .field-label:first-of-type { margin-top: 0; }
        .field-input, .field-select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 9px; padding: 11px 12px; color: #e8e9ee; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.2s; }
        .field-input:focus, .field-select:focus { border-color: rgba(61,220,151,0.4); }

        .seg-row { display: flex; gap: 8px; }
        .seg-opt { flex: 1; text-align: center; padding: 9px 0; border-radius: 9px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #9598a8; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;}
        .seg-opt.active { background: rgba(61,220,151,0.14); border-color: rgba(61,220,151,0.35); color: #3ddc97; }

        .quick-amt-row { display: flex; gap: 8px; margin-top: 10px; }
        .quick-amt { flex: 1; text-align: center; padding: 8px 0; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: #9598a8; font-size: 11.5px; font-weight: 600; cursor: pointer; }

        .sheet-btn { width: 100%; margin-top: 18px; padding: 13px 0; border-radius: 11px; text-align: center; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
        .sheet-btn:active { opacity: 0.8; }
        .sheet-btn.primary { background: rgba(61,220,151,0.16); border: 1px solid rgba(61,220,151,0.4); color: #3ddc97; }
        .sheet-btn.danger { background: rgba(255,107,107,0.16); border: 1px solid rgba(255,107,107,0.4); color: #ff6b6b; }
        .sheet-btn.secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #cfd2dc; margin-top: 8px; }

        .warn-box { background: rgba(255,107,107,0.08); border: 1px solid rgba(255,107,107,0.25); border-radius: 10px; padding: 12px; color: #ff9c9c; font-size: 11.5px; line-height: 1.5; margin-top: 4px; }
        .confirm-check { display: flex; align-items: center; gap: 8px; margin-top: 12px; color: #cfd2dc; font-size: 11.5px; }

        .stmt-summary { display: flex; justify-content: space-between; margin-bottom: 14px; }
        .stmt-stat .l { color: #6e7284; font-size: 9.5px; }
        .stmt-stat .v { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: #cfd2dc; margin-top: 3px; }
        .stmt-stat .v.in { color: #3ddc97; } .stmt-stat .v.out { color: #ff6b6b; }
        .stmt-pdf-btn { display: flex; align-items: center; justify-content: center; gap: 7px; background: rgba(61,220,151,0.1); border: 1px solid rgba(61,220,151,0.25); color: #3ddc97; font-size: 12px; font-weight: 700; padding: 10px 0; border-radius: 10px; cursor: pointer; margin-bottom: 14px; }
        .stmt-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-top: 1px solid rgba(255,255,255,0.05); }
        .stmt-list .stmt-row:first-child { border-top: none; }
        .stmt-left .t { color: #d5d7e0; font-size: 12.5px; font-weight: 600; }
        .stmt-left .d { color: #5c6072; font-size: 9.5px; margin-top: 2px; }
        .stmt-amt { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; }
        .stmt-amt.in { color: #3ddc97; } .stmt-amt.out { color: #ff6b6b; }

        .toast { position: fixed; left: 50%; bottom: 85px; transform: translateX(-50%) translateY(20px); background: #191b26; border: 1px solid rgba(61,220,151,0.3); color: #3ddc97; font-size: 12.5px; font-weight: 600; padding: 12px 18px; border-radius: 10px; opacity: 0; pointer-events: none; transition: all 0.25s ease; display: flex; align-items: center; gap: 8px; z-index: 60; }
        .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      `}</style>

      <div className="more-wrapper sm:max-w-md sm:mx-auto">
        <div className="scroll-area hide-scrollbar">

          <div className="header"><div className="title">More</div></div>

          <div className="profile-card">
            <div className="avatar">{initials(profileName)}</div>
            <div className="profile-text">
              <div className="profile-name">{profileName}</div>
              <div className="profile-sub">ID: OL-2026-0089</div>
            </div>
            <div className="edit-link" onClick={() => { setEditName(profileName); setActiveSheet('profile'); }}>Edit</div>
          </div>

          <div className="balance-card">
            <div className="balance-label">VIRTUAL BALANCE</div>
            <div className="balance-val">₹{formatMoney(currentTotalAssets)}</div>
            <div className="balance-sub">
              ₹{formatMoney(netCashInserted)} added · {tradingPL >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(tradingPL))} from trading
            </div>
            <div className="balance-actions">
              <div className="bal-btn add" onClick={() => openMoneySheet('deposit')}>+ Add Money</div>
              <div className="bal-btn withdraw" onClick={() => openMoneySheet('withdraw')}>− Withdraw</div>
            </div>
          </div>

          <div className="pl-twin">
            <div className="pl-mini">
              <div className="l">TRADING P&amp;L</div>
              <div className={`v ${tradingPL < 0 ? 'neg' : ''}`}>{tradingPL >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(tradingPL))}</div>
              <div className="s">From closed trades only</div>
            </div>
            <div className="pl-mini">
              <div className="l">ACTUAL P&amp;L</div>
              <div className={`v ${actualPL < 0 ? 'neg' : ''}`}>{actualPL >= 0 ? '+' : '−'}₹{formatMoney(Math.abs(actualPL))}</div>
              <div className="s">Based on money in vs out</div>
            </div>
          </div>

          <div className="group-label">Capital &amp; Records</div>
          <div className="menu-section">
            <div className="menu-row" onClick={() => setActiveSheet('statement')}>
              <div className="menu-icon mint"><FileText size={16} /></div>
              <div className="menu-text"><div className="menu-t">Statement</div><div className="menu-s">All deposits &amp; withdrawals</div></div>
              <ChevronRight className="menu-chev" />
            </div>
            <div className="menu-row" onClick={() => setActiveSheet('charges')}>
              <div className="menu-icon orange"><Settings size={16} /></div>
              <div className="menu-text"><div className="menu-t">Charges &amp; Brokerage</div><div className="menu-s">Custom configuration for all 6 charges</div></div>
              <ChevronRight className="menu-chev" />
            </div>
          </div>

          <div className="group-label">Trading Setup</div>
          <div className="menu-section">
            <div className="menu-row" onClick={() => setActiveSheet('manageindex')}>
              <div className="menu-icon blue"><PlusCircle size={16} /></div>
              <div className="menu-text"><div className="menu-t">Manage Indices</div><div className="menu-s">Edit lot sizes, steps & expiries</div></div>
              <ChevronRight className="menu-chev" />
            </div>
            <div className="menu-row" onClick={() => setActiveSheet('defaults')}>
              <div className="menu-icon blue"><Sliders size={16} /></div>
              <div className="menu-text"><div className="menu-t">Default Trade Settings</div><div className="menu-s">Default lot size, target &amp; SL %</div></div>
              <ChevronRight className="menu-chev" />
            </div>
          </div>

          <div className="group-label">App Data</div>
          <div className="menu-section">
            <div className="menu-row" onClick={handleExportBackup}>
              <div className="menu-icon grey"><Download size={16} /></div>
              <div className="menu-text"><div className="menu-t">Export Backup</div><div className="menu-s">Save your data to phone</div></div>
              <ChevronRight className="menu-chev" />
            </div>

            <input type="file" accept=".json" id="restore-backup" className="hidden" ref={fileInputRef} onChange={handleRestoreBackup} />
            <div className="menu-row" onClick={() => fileInputRef.current?.click()}>
              <div className="menu-icon grey"><UploadCloud size={16} /></div>
              <div className="menu-text"><div className="menu-t">Restore Backup</div><div className="menu-s">Load from previous JSON</div></div>
              <ChevronRight className="menu-chev" />
            </div>

            <div className="menu-row" onClick={() => showToast('OptionLab · Trading Simulator')}>
              <div className="menu-icon grey"><Info size={16} /></div>
              <div className="menu-text"><div className="menu-t">About &amp; Help</div><div className="menu-s">Version 1.0 · Feedback</div></div>
            </div>
          </div>

          <div className="group-label">Danger Zone</div>
          <div className="menu-section">
            <div className="menu-row" onClick={() => setActiveSheet('reset')}>
              <div className="menu-icon red"><Trash2 size={16} /></div>
              <div className="menu-text"><div className="menu-t" style={{color:'#ff6b6b'}}>Reset App</div><div className="menu-s">Erase all balance, statement &amp; trades</div></div>
              <ChevronRight className="menu-chev" />
            </div>
          </div>

        </div>

        {/* MODALS */}
        {activeSheet === 'profile' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet">
              <div className="sheet-title">Edit Profile</div>
              <div className="sheet-sub">This name appears across the app</div>
              <div className="field-label">Full Name</div>
              <input className="field-input" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter your name" />
              <div className="sheet-btn primary" onClick={() => { setProfileName(editName); setActiveSheet(null); showToast('Profile updated'); }}>Save Changes</div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {activeSheet === 'money' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet">
              <div className="sheet-title">{moneyMode === 'deposit' ? 'Add Money' : 'Withdraw Money'}</div>
              <div className="sheet-sub">This modifies your virtual balance, separate from trading P&amp;L</div>
              <div className="field-label">Amount (₹)</div>
              <input className="field-input" type="number" value={moneyAmount} onChange={(e) => setMoneyAmount(e.target.value)} placeholder="₹ 0" />
              <div className="quick-amt-row">
                <div className="quick-amt" onClick={() => setMoneyAmount(10000)}>+10K</div>
                <div className="quick-amt" onClick={() => setMoneyAmount(50000)}>+50K</div>
                <div className="quick-amt" onClick={() => setMoneyAmount(100000)}>+1L</div>
                <div className="quick-amt" onClick={() => setMoneyAmount(500000)}>+5L</div>
              </div>
              <div className="field-label">Note (optional)</div>
              <input className="field-input" type="text" value={moneyNote} onChange={(e) => setMoneyNote(e.target.value)} placeholder="e.g. Monthly top-up" />
              <div className={`sheet-btn ${moneyMode === 'deposit' ? 'primary' : 'danger'}`} onClick={handleConfirmMoney}>
                Confirm {moneyMode === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {/* DEFAULT TRADE SETTINGS MODAL */}
        {activeSheet === 'defaults' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet">
              <div className="sheet-title">Default Trade Settings</div>
              <div className="sheet-sub">Auto-fills when you open the trade screen</div>

              <div className="flex gap-4">
                 <div className="flex-1">
                    <div className="field-label">Default Lot Qty</div>
                    <input className="field-input" type="number" value={defaultForm.lotSize} onChange={e => setDefaultForm({...defaultForm, lotSize: e.target.value})} placeholder="1" />
                 </div>
              </div>
              <div className="flex gap-4 mt-2">
                 <div className="flex-1">
                    <div className="field-label">Default Target (%)</div>
                    <input className="field-input" type="number" value={defaultForm.targetPct} onChange={e => setDefaultForm({...defaultForm, targetPct: e.target.value})} placeholder="30" />
                 </div>
                 <div className="flex-1">
                    <div className="field-label">Default SL (%)</div>
                    <input className="field-input" type="number" value={defaultForm.slPct} onChange={e => setDefaultForm({...defaultForm, slPct: e.target.value})} placeholder="20" />
                 </div>
              </div>

              <div className="sheet-btn primary mt-6" onClick={handleSaveDefaults}>Save Settings</div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {/* INDEX MANAGER MODAL (UPGRADED) */}
        {activeSheet === 'manageindex' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet" style={{ maxHeight: '92%' }}>
              <div className="sheet-title">Manage Indices</div>
              <div className="sheet-sub">Edit existing or add custom indices</div>

              <div className="field-label">Select Index</div>
              <select className="field-select mb-3" value={manageIdx} onChange={e => setManageIdx(e.target.value)}>
                 {allIndicesList.map(i => <option key={i} value={i}>{i}</option>)}
                 <option value="NEW">+ Add New Custom Index</option>
              </select>

              {manageIdx === 'NEW' && (
                 <>
                   <div className="field-label">Index Name (e.g. CRUDEOIL)</div>
                   <input className="field-input mb-2" type="text" value={idxForm.name} onChange={e => setIdxForm({...idxForm, name: e.target.value.toUpperCase()})} placeholder="Enter name..." />
                 </>
              )}

              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="field-label">Category</div>
                  <select className="field-select" value={idxForm.type} onChange={e => setIdxForm({...idxForm, type: e.target.value})}>
                     <option>Equity Index</option>
                     <option>BSE Index</option>
                     <option>Commodity</option>
                     <option>Currency</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="field-label">Trading Hours</div>
                  <input className="field-input" type="text" value={idxForm.timing} onChange={e => setIdxForm({...idxForm, timing: e.target.value})} placeholder="e.g. 09:15 - 15:30" />
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="field-label">Lot Size</div>
                  <input className="field-input" type="number" value={idxForm.lotSize} onChange={e => setIdxForm({...idxForm, lotSize: e.target.value})} placeholder="25" />
                </div>
                <div className="flex-1">
                  <div className="field-label">Strike Step</div>
                  <input className="field-input" type="number" value={idxForm.stepSize} onChange={e => setIdxForm({...idxForm, stepSize: e.target.value})} placeholder="50" />
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <div className="flex-1">
                  <div className="field-label">Expiry Frequency</div>
                  <select className="field-select" value={idxForm.expiryFreq} onChange={e => setIdxForm({...idxForm, expiryFreq: e.target.value})}>
                     <option>Weekly</option>
                     <option>Monthly</option>
                  </select>
                </div>
                <div className="flex-1">
                  <div className="field-label">Expiry Day</div>
                  <select className="field-select" value={idxForm.expiryDay} onChange={e => setIdxForm({...idxForm, expiryDay: e.target.value})}>
                     <option>Monday</option><option>Tuesday</option><option>Wednesday</option>
                     <option>Thursday</option><option>Friday</option>
                  </select>
                </div>
              </div>

              <div className="sheet-btn primary mt-6" onClick={handleSaveIndex}>Save Configuration</div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {/* CHARGES MODAL */}
        {activeSheet === 'charges' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet" style={{ maxHeight: '92%' }}>
              <div className="sheet-title">Charges &amp; Brokerage Configuration</div>
              <div className="sheet-sub">Calculates net P&amp;L automatically on exit</div>

              <div className="space-y-4 mt-2">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="field-label">Brokerage (₹ per leg)</div>
                    <input className="field-input" type="number" value={chargeForm.brokerage} onChange={(e) => setChargeForm({...chargeForm, brokerage: e.target.value})} placeholder="20" />
                  </div>
                  <div className="flex-1">
                    <div className="field-label">STT / CTT (%)</div>
                    <input className="field-input" type="number" step="0.001" value={chargeForm.stt} onChange={(e) => setChargeForm({...chargeForm, stt: e.target.value})} placeholder="0.125" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="field-label">NSE Transaction (%)</div>
                    <input className="field-input" type="number" step="0.00001" value={chargeForm.txn} onChange={(e) => setChargeForm({...chargeForm, txn: e.target.value})} placeholder="0.03503" />
                  </div>
                  <div className="flex-1">
                    <div className="field-label">SEBI Fee (%)</div>
                    <input className="field-input" type="number" step="0.00001" value={chargeForm.sebi} onChange={(e) => setChargeForm({...chargeForm, sebi: e.target.value})} placeholder="0.0001" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="field-label">Stamp Duty (%)</div>
                    <input className="field-input" type="number" step="0.001" value={chargeForm.stamp} onChange={(e) => setChargeForm({...chargeForm, stamp: e.target.value})} placeholder="0.003" />
                  </div>
                  <div className="flex-1">
                    <div className="field-label">GST (%)</div>
                    <input className="field-input" type="number" value={chargeForm.gst} onChange={(e) => setChargeForm({...chargeForm, gst: e.target.value})} placeholder="18" />
                  </div>
                </div>
              </div>

              <div className="sheet-btn primary mt-6" onClick={handleSaveCharges}>Save Configuration</div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {/* RESET APP MODAL */}
        {activeSheet === 'reset' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet">
              <div className="sheet-title" style={{color:'#ff6b6b'}}>Reset App</div>
              <div className="sheet-sub">This cannot be undone</div>
              <div className="warn-box">This permanently erases virtual balance, statement history, trades, journal notes, and settings. App will return to a fresh install state.</div>
              <label className="confirm-check cursor-pointer">
                <input type="checkbox" checked={confirmReset} onChange={(e) => setConfirmReset(e.target.checked)} className="accent-[#ff6b6b] w-4 h-4" />
                <span>I understand this cannot be undone</span>
              </label>
              <div className="sheet-btn danger" onClick={handleReset}>Erase Everything</div>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Cancel</div>
            </div>
          </div>
        )}

        {/* STATEMENT MODAL */}
        {activeSheet === 'statement' && (
          <div className="overlay" onClick={(e) => { if(e.target === e.currentTarget) setActiveSheet(null); }}>
            <div className="sheet" style={{ maxHeight: '92%' }}>
              <div className="sheet-title">Statement</div>
              <div className="sheet-sub">Every deposit &amp; withdrawal</div>

              <div id="print-statement">
                <div className="stmt-summary">
                  <div className="stmt-stat"><div className="l">TOTAL IN</div><div className="v in">₹{formatMoney(deposits)}</div></div>
                  <div className="stmt-stat"><div className="l">TOTAL OUT</div><div className="v out">₹{formatMoney(withdrawals)}</div></div>
                  <div className="stmt-stat"><div className="l">NET</div><div className="v">₹{formatMoney(deposits - withdrawals)}</div></div>
                </div>

                <div className="mt-2 mb-4">
                  {statement.length === 0 ? (
                    <div className="text-center text-[#5c6072] text-xs py-8">No transactions yet</div>
                  ) : (
                    [...statement].reverse().map(s => (
                      <div key={s.id} className="stmt-row">
                        <div className="stmt-left">
                          <div className="t">{s.type === 'deposit' ? 'Money Added' : 'Money Withdrawn'}</div>
                          <div className="d">{formatDate(s.date)} {s.note ? `· ${s.note}` : ''}</div>
                        </div>
                        <div className={`stmt-amt ${s.type === 'deposit' ? 'in' : 'out'}`}>
                          {s.type === 'deposit' ? '+' : '−'}₹{formatMoney(s.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button className="stmt-pdf-btn w-full" onClick={handleExportStatement}>
                <Download size={14} /> Download PDF
              </button>
              <div className="sheet-btn secondary" onClick={() => setActiveSheet(null)}>Close</div>
            </div>
          </div>
        )}

        {/* TOAST POPUP */}
        <div className={`toast ${toastMsg ? 'show' : ''}`}>
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>

      </div>
    </>
  );
}
