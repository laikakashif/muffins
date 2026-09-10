import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, QrCode, Sparkles, X } from 'lucide-react';
import AnimatedPrice from './AnimatedPrice';

interface MuffinnsQRCodeCardProps {
  accountNumber?: string;
  amount?: number;
  compact?: boolean;
  onClose?: () => void;
}

export default function MuffinnsQRCodeCard({
  accountNumber = '3398787000005900',
  amount,
  compact = false,
  onClose
}: MuffinnsQRCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrFormat, setQrFormat] = useState<'plain' | 'raast' | 'faysal'>('plain');

  // Payload for QR code generation tailored to Pakistani Banking Apps (Easypaisa, JazzCash, Faysal Bank, etc.)
  const getQrPayload = () => {
    switch (qrFormat) {
      case 'raast':
        // SBP Raast Merchant EMVCo standard payload for Till ID 3398787000005900
        return `00020101021226440012PK.RAAST.0116${accountNumber}5204581253035865802PK5916MUFFINNS BAKERS6008KARACHI6304C741`;
      case 'faysal':
        // Faysal Bank Direct IBFT String
        return `000201021226520012PK.RAAST.0116${accountNumber}0216FAYSALBANKLIMITED5204581253035865802PK5921MUFFINNS SWEETS BAKERS6008KARACHI6304A1B2`;
      case 'plain':
      default:
        // Plain Account/Till number string directly
        return accountNumber;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-2xl border-3 border-amber-400 bg-[#ffdf15] ${compact ? 'p-2 max-w-[280px]' : 'p-3 max-w-xs'} mx-auto flex flex-col items-center select-none text-brand-chocolate`}>
      
      {/* Prominent Floating Top-Right Cross (X) Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-40 w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer border-2 border-white"
          title="Close QR Code"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Radiant Sunburst Background Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-100">
          {[...Array(32)].map((_, i) => {
            const angle1 = (i * 360) / 32;
            const angle2 = ((i + 0.5) * 360) / 32;
            const rad1 = (angle1 * Math.PI) / 180;
            const rad2 = (angle2 * Math.PI) / 180;
            const x1 = 50 + 90 * Math.cos(rad1);
            const y1 = 50 + 90 * Math.sin(rad1);
            const x2 = 50 + 90 * Math.cos(rad2);
            const y2 = 50 + 90 * Math.sin(rad2);
            return (
              <path key={`sunburst-${i}`} d={`M50,50 L${x1},${y1} A90,90 0 0,1 ${x2},${y2} Z`} />
            );
          })}
        </svg>
      </div>

      {/* Main Card Frame with Thin White Inner Border */}
      <div className="border border-white/90 bg-[#ffdf15] w-full rounded-xl p-2 flex flex-col items-center relative overflow-hidden shadow-inner">
        
        {/* 1. Header Branding: A&P TRADING SOLUTION'S */}
        <div className="flex items-center gap-1 justify-center mb-1">
          <span className="text-xl font-black tracking-tighter text-[#c1272d] font-sans drop-shadow-xs">A&P</span>
          
          <div className="w-4 h-4 flex items-center justify-center text-[#c1272d]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M3.5 18.5l6-6 4 4 7-7M20.5 9.5v5h-5" stroke="#c1272d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          <div className="flex flex-col items-start leading-none text-[#c1272d]">
            <span className="text-[10px] font-black tracking-tight uppercase">TRADING</span>
            <span className="text-[6px] font-black tracking-wider uppercase opacity-90">SOLUTION'S</span>
          </div>
        </div>

        {/* 2. Logo Box: پتاشے MUFFINNS SWEETS & BAKERS */}
        <div className="bg-white border border-[#c1272d] rounded-md py-0.5 px-3 shadow-xs relative flex flex-col items-center justify-center min-w-[120px] mb-1.5">
          <span className="font-serif text-[#c1272d] text-lg font-bold leading-none select-none tracking-tight">پتاشے</span>
          <div className="flex flex-col items-center leading-none">
            <span className="text-[9px] font-black text-slate-900 tracking-tight">MuffInns</span>
            <span className="text-[5px] font-black text-slate-600 tracking-widest uppercase">SWEETS & BAKERS</span>
          </div>
        </div>

        {/* 3. Faysal Bank Pill Badge */}
        <div className="bg-white px-2.5 py-0.5 rounded-full flex items-center justify-center gap-1.5 shadow-xs border border-slate-200 mb-1.5">
          <span className="text-[10px] font-black tracking-tight text-[#003366]">faysalbank</span>
          <div className="w-3 h-3 bg-[#003366] rounded flex items-center justify-center rotate-45 border border-white shrink-0">
            <svg viewBox="0 0 24 24" className="-rotate-45 w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M4 12c4 0 6-2 8-6 2 4 4 6 8 6M12 6v14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* 4. High-Contrast Scannable QR Code */}
        <div className="bg-white p-1.5 rounded-xl shadow-md border border-slate-900/10 mb-1.5 flex flex-col items-center justify-center relative">
          <QRCodeSVG 
            value={getQrPayload()}
            size={compact ? 110 : 130}
            level="H"
            includeMargin={true}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>

        {/* Amount line if provided */}
        {amount !== undefined && (
          <div className="mb-1 bg-amber-950/10 px-2 py-0.5 rounded text-center border border-amber-900/10 w-full">
            <span className="text-[9px] font-medium text-amber-950">Payable: </span>
            <AnimatedPrice value={amount} className="font-bold text-xs text-brand-chocolate" />
          </div>
        )}

        {/* 5. Red Account / Till Number Text */}
        <div className="w-full text-center py-0.5 flex flex-col items-center justify-center">
          <span className="text-base font-black font-mono tracking-wider text-[#c1272d] select-all leading-tight">
            {accountNumber}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <button
              type="button"
              onClick={handleCopy}
              className="px-2 py-0.5 bg-[#c1272d] hover:bg-[#a81f24] active:scale-95 text-white rounded-md text-[9px] font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-2.5 h-2.5 text-emerald-300" /> : <Copy className="w-2.5 h-2.5 text-white" />}
              <span>{copied ? 'Copied!' : 'Copy Till Number'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* QR Compatibility Format Switcher */}
      <div className="w-full mt-1.5 flex items-center justify-between px-1 text-[9px] bg-amber-400/40 p-1 rounded-lg border border-amber-500/30">
        <span className="text-amber-950 font-bold flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-amber-800" />
          <span>Format:</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setQrFormat('plain')}
            className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-all ${qrFormat === 'plain' ? 'bg-[#c1272d] text-white shadow-2xs' : 'text-amber-950 hover:bg-amber-300'}`}
            title="Plain Account / Till Number"
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => setQrFormat('raast')}
            className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-all ${qrFormat === 'raast' ? 'bg-[#c1272d] text-white shadow-2xs' : 'text-amber-950 hover:bg-amber-300'}`}
            title="Official SBP Raast QR Standard"
          >
            Raast
          </button>
          <button
            type="button"
            onClick={() => setQrFormat('faysal')}
            className={`px-1.5 py-0.5 rounded cursor-pointer font-bold transition-all ${qrFormat === 'faysal' ? 'bg-[#c1272d] text-white shadow-2xs' : 'text-amber-950 hover:bg-amber-300'}`}
            title="Faysal Bank App Direct IBFT"
          >
            Faysal
          </button>
        </div>
      </div>
    </div>
  );
}

