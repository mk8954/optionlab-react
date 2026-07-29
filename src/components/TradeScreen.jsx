import React, { useState } from 'react';
import { ArrowLeft, Info, ChevronDown, Minus, Plus, X } from 'lucide-react';

export default function TradeScreen({ onBack }) {
  const selectedOption = { symbol: 'NIFTY', strike: 24050, type: 'PE', expiry: '28-JUL-26' };
  const currentLTP = 64.30;
  const lotSize = 65;

  const [lots, setLots] = useState(1);
  const [premium, setPremium] = useState(currentLTP.toFixed(2));
  const [slPercent, setSlPercent] = useState(5);
  const [targetPercent, setTargetPercent] = useState(10);
  const [showSmartOrders, setShowSmartOrders] = useState(true);
  const [showCharges, setShowCharges] = useState(false);
  const [reasonsList, setReasonsList] = useState(['Breakout', 'Support', 'Resistance', 'Scalping']);
  const [selectedReasons, setSelectedReasons] = useState(['Breakout']);
  const [customReason, setCustomReason] = useState('');

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
    const total = bro + stt + txn + sebi + stamp + gst;
    return { bro, stt, txn, sebi, stamp, gst, total };
  };

  const qty = lots * lotSize;
  const numPremium = Number(premium) || 0;
  const marginReq = qty * numPremium;
  const slPrice = (numPremium * (1 - slPercent / 100)).toFixed(2);
  const targetPrice = (numPremium * (1 + targetPercent / 100)).toFixed(2);
  const risk = (numPremium - parseFloat(slPrice)) * qty;
  const reward = (parseFloat(targetPrice) - numPremium) * qty;
  const rrRatio = risk > 0 ? (reward / risk).toFixed(2) : "0.00";
  const riskPct = risk + reward > 0 ? (risk / (risk + reward)) * 100 : 50;
  const rewardPct = 100 - riskPct;
  const entryCharges = calcCharges(numPremium, 0, qty, false);
  const beCharges = calcCharges(numPremium, numPremium, qty, true);
  const breakEven = numPremium > 0 ? (numPremium + (beCharges.total / qty)).toFixed(2) : "0.00";

  const handleAddCustomReason = (e) => {
    if (e.key === 'Enter' && customReason.trim() !== '') {
      const newReason = customReason.trim();
      if (!reasonsList.includes(newReason)) setReasonsList([...reasonsList, newReason]);
      if (!selectedReasons.includes(newReason)) setSelectedReasons([...selectedReasons, newReason]);
      setCustomReason('');
    }
  };

  const toggleReason = (reason) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const removeReasonFromList = (e, reason) => {
    e.stopPropagation();
    setReasonsList(reasonsList.filter(r => r !== reason));
    setSelectedReasons(selectedReasons.filter(r => r !== reason));
  };

  return (
    <div className="flex flex-col h-screen w-full sm:max-w-md sm:mx-auto bg-[#141824] text-[#e2e5eb] font-sans relative overflow-hidden">

      <header className="px-4 py-4 flex items-center justify-between bg-[#141824]">
        <div className="flex items-center space-x-4">
          <ArrowLeft onClick={onBack} className="w-5 h-5 text-white cursor-pointer hover:text-[#828b9d] transition-colors" />
          <div>
            <h1 className="text-white font-semibold text-[15px] leading-tight flex items-center">
              {selectedOption.symbol} <span className="text-[9px] bg-[#1d2232] text-[#828b9d] px-1.5 py-0.5 rounded-sm ml-2 border border-[#252b3d]">NSE FO</span>
            </h1>
            <p className="text-[#828b9d] text-[11px] mt-0.5">{selectedOption.expiry + " " + selectedOption.strike + " " + selectedOption.type}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="grid grid-cols-2 gap-4 mb-6 mt-1">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="text-[#828b9d] text-xs font-semibold block tracking-wide">LOTS</label>
              <span className="text-[10px] text-[#828b9d] font-medium flex items-center">Lot = {lotSize} <Info className="w-3.5 h-3.5 ml-1" /></span>
            </div>
            <div className="flex h-12 border border-[#252b3d] rounded bg-[#0e121b] overflow-hidden">
              <button onClick={() => setLots(Math.max(1, lots - 1))} className="w-12 flex items-center justify-center bg-[#181c2a] hover:bg-[#1d2232] text-[#35b89e] border-r border-[#252b3d] transition-colors focus:outline-none"><Minus className="w-5 h-5" /></button>
              <div className="flex-1 flex items-center justify-center text-white text-base font-semibold">{lots}</div>
              <button onClick={() => setLots(lots + 1)} className="w-12 flex items-center justify-center bg-[#181c2a] hover:bg-[#1d2232] text-[#35b89e] border-l border-[#252b3d] transition-colors focus:outline-none"><Plus className="w-5 h-5" /></button>
            </div>
          </div>
          <div>
            <label className="text-[#828b9d] text-xs font-semibold mb-2 block tracking-wide">PREMIUM</label>
            <div className="relative h-12 bg-[#0e121b] border border-[#252b3d] rounded flex items-center overflow-hidden">
              <span className="pl-4 text-[#828b9d] font-semibold text-base">₹</span>
              <input type="number" value={premium} onChange={(e) => setPremium(e.target.value)} className="w-full h-full bg-transparent text-white text-right pr-4 text-base font-semibold focus:outline-none" step="0.05" />
            </div>
          </div>
        </div>

        <div className="text-right px-1 -mt-4 mb-3">
            <span className="text-xs text-[#828b9d] font-medium">Total Qty: <span className="text-gray-300 font-semibold">{qty}</span></span>
        </div>

        <div className="border border-[#252b3d] bg-[#181c2a] rounded mb-4">
          <button onClick={() => setShowSmartOrders(!showSmartOrders)} className="w-full flex justify-between items-center p-3 focus:outline-none">
            <span className="text-sm font-semibold text-gray-300">Smart Orders <span className="text-[#828b9d] font-normal ml-1 text-xs">(STOP LOSS & TARGET)</span></span>
            <ChevronDown className={"w-5 h-5 text-[#828b9d] transition-transform " + (showSmartOrders ? "rotate-180" : "")} />
          </button>

          {showSmartOrders && (
            <div className="p-3 pt-0 border-t border-[#252b3d] mt-1 space-y-3">
              <div className="flex justify-between space-x-4 pt-3">
                <div className="flex-1">
                  <label className="text-[#828b9d] text-[10px] mb-1.5 block uppercase tracking-wider font-semibold">Stop Loss %</label>
                  <div className="flex h-9 border border-[#252b3d] rounded bg-[#0e121b] overflow-hidden mb-1.5">
                    <button onClick={() => setSlPercent(Math.max(0, slPercent - 5))} className="w-10 flex items-center justify-center text-[#35b89e] bg-[#181c2a] hover:bg-[#1d2232] border-r border-[#252b3d] focus:outline-none"><Minus className="w-3.5 h-3.5"/></button>
                    <div className="flex-1 flex items-center justify-center text-white text-sm font-semibold">{slPercent}</div>
                    <button onClick={() => setSlPercent(slPercent + 5)} className="w-10 flex items-center justify-center text-[#35b89e] bg-[#181c2a] hover:bg-[#1d2232] border-l border-[#252b3d] focus:outline-none"><Plus className="w-3.5 h-3.5"/></button>
                  </div>
                  <div className="text-[#e64b4b] text-xs font-semibold">₹{slPrice}</div>
                </div>

                <div className="flex-1 flex flex-col items-end">
                  <label className="text-[#828b9d] text-[10px] mb-1.5 block uppercase tracking-wider font-semibold w-full text-right">Target %</label>
                  <div className="flex h-9 border border-[#252b3d] rounded bg-[#0e121b] overflow-hidden mb-1.5 w-full">
                    <button onClick={() => setTargetPercent(Math.max(0, targetPercent - 5))} className="w-10 flex items-center justify-center text-[#35b89e] bg-[#181c2a] hover:bg-[#1d2232] border-r border-[#252b3d] focus:outline-none"><Minus className="w-3.5 h-3.5"/></button>
                    <div className="flex-1 flex items-center justify-center text-white text-sm font-semibold">{targetPercent}</div>
                    <button onClick={() => setTargetPercent(targetPercent + 5)} className="w-10 flex items-center justify-center text-[#35b89e] bg-[#181c2a] hover:bg-[#1d2232] border-l border-[#252b3d] focus:outline-none"><Plus className="w-3.5 h-3.5"/></button>
                  </div>
                  <div className="text-[#35b89e] text-xs font-semibold">₹{targetPrice}</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-2 font-semibold">
                  <span className="text-[#828b9d]">Risk <span className="text-white ml-1">₹{risk.toFixed(0)}</span></span>
                  <span className="text-[#828b9d] font-bold bg-[#1d2232] px-2 py-0.5 rounded-sm border border-[#252b3d]">1 : {rrRatio}</span>
                  <span className="text-[#828b9d]">Reward <span className="text-[#35b89e] ml-1">₹{reward.toFixed(0)}</span></span>
                </div>
                <div className="w-full h-2 bg-[#0e121b] rounded-full flex overflow-hidden border border-[#252b3d]">
                  <div className="bg-[#e64b4b] h-full transition-all duration-300" style={{ width: riskPct + "%" }}></div>
                  <div className="bg-[#35b89e] h-full transition-all duration-300" style={{ width: rewardPct + "%" }}></div>
                </div>
                <div className="text-center mt-3 text-xs text-[#828b9d] font-medium">Break Even: <span className="text-gray-300 font-semibold ml-1">₹{breakEven}</span> <span className="text-gray-500 font-normal ml-1">(₹{beCharges.total.toFixed(2)} fees)</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="border border-[#252b3d] bg-[#181c2a] rounded mb-5">
          <button onClick={() => setShowCharges(!showCharges)} className="w-full flex justify-between items-center p-3 focus:outline-none">
            <span className="text-sm font-semibold text-gray-300">Charges (Approx)</span>
            <div className="flex items-center text-sm font-semibold text-white">₹{entryCharges.total.toFixed(2)} <ChevronDown className={"w-5 h-5 text-[#828b9d] ml-2 transition-transform " + (showCharges ? "rotate-180" : "")} /></div>
          </button>

          {showCharges && (
            <div className="p-4 bg-[#0e121b] border-t border-[#252b3d] space-y-2">
              <div className="flex justify-between text-xs text-[#828b9d] font-medium pb-2 border-b border-[#252b3d] mb-3"><span>Charge Type</span><span>Buy Order</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>Brokerage</span><span>₹{entryCharges.bro.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>STT/CTT</span><span>₹{entryCharges.stt.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>NSE Txn</span><span>₹{entryCharges.txn.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>SEBI Fee</span><span>₹{entryCharges.sebi.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>Stamp Duty</span><span>₹{entryCharges.stamp.toFixed(2)}</span></div>
              <div className="flex justify-between items-center text-xs text-[#828b9d]"><span>GST</span><span>₹{entryCharges.gst.toFixed(2)}</span></div>
            </div>
          )}
        </div>

        <div className="mb-4">
           <p className="text-sm font-semibold text-gray-300 mb-3">Reason for Entry</p>
           <div className="flex flex-wrap gap-2 items-center">
             {reasonsList.map((reason) => {
               const isSelected = selectedReasons.includes(reason);
               return (
                 <div key={reason} className={"flex items-center rounded border transition-colors overflow-hidden " + (isSelected ? "bg-[#152422] border-[#35b89e]" : "bg-[#0e121b] border-[#252b3d] hover:border-gray-500")}>
                   <button onClick={() => toggleReason(reason)} className={"px-3 py-1.5 text-[11px] font-semibold focus:outline-none " + (isSelected ? "text-[#35b89e]" : "text-[#828b9d]")}>{reason}</button>
                   <div onClick={(e) => removeReasonFromList(e, reason)} className={"pr-2 py-1.5 cursor-pointer flex items-center " + (isSelected ? "text-[#35b89e]/60 hover:text-[#35b89e]" : "text-[#828b9d]/60 hover:text-[#828b9d]")}><X className="w-3 h-3" /></div>
                 </div>
               );
             })}
             <div className="relative"><input type="text" value={customReason} onChange={(e) => setCustomReason(e.target.value)} onKeyDown={handleAddCustomReason} placeholder="+ Add custom" className="bg-[#181c2a] text-[#e2e5eb] border border-[#252b3d] border-dashed rounded px-3 py-1.5 text-[11px] font-semibold w-24 focus:outline-none focus:border-[#35b89e] focus:border-solid transition-colors placeholder:text-[#828b9d]" /></div>
           </div>
           <p className="text-[9px] text-[#828b9d] mt-2 ml-1">Type a custom tag and press Enter to add.</p>
        </div>
      </div>

      <div className="absolute bottom-0 w-full bg-[#181c2a] border-t border-[#252b3d] p-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
         <div className="flex justify-between items-end mb-4">
           <div>
             <p className="text-[#828b9d] text-xs mb-1 font-medium">Margin Required (Approx)</p>
             <p className="text-white text-lg font-bold">{"₹" + marginReq.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
           </div>
           <div className="flex items-center text-[#828b9d] text-xs font-medium cursor-pointer">Available Cash <Info className="w-4 h-4 ml-1.5" /></div>
         </div>
         <button className="w-full h-14 bg-[#3ab49a] hover:bg-[#329e87] text-[#05110f] font-bold text-sm tracking-wide rounded transition-colors uppercase focus:outline-none">Place Buy Order</button>
      </div>
    </div>
  );
}
