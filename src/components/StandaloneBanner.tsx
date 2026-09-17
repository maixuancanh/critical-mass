// src/components/StandaloneBanner.tsx
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Atom, Clock, Activity } from 'lucide-react';

interface StandaloneBannerProps {
  isStandalone: boolean;
  walletAddress?: string;
  smartVaultBalance?: string;
}

export const StandaloneBanner: React.FC<StandaloneBannerProps> = ({
  isStandalone,
  smartVaultBalance,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-[#050c08] border-b border-emerald-500/30 px-4 py-2.5 font-mono text-xs text-emerald-400 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-3">
        {/* Left: Brand / Official Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="Critical Mass Logo"
              className="w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-emerald-200 via-emerald-100 to-teal-300 bg-clip-text text-transparent font-black tracking-widest text-base drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                CRITICAL MASS
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-semibold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="text-[10px] text-emerald-500/70 tracking-wider font-mono">
              TOROIDAL CASCADE CASINO // ON-CHAIN VRF
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry */}
        <div className="hidden md:flex items-center gap-4 text-[11px] text-emerald-400/80 bg-black/40 px-3 py-1 rounded-md border border-emerald-500/20">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-emerald-500" />
            <span>{timeStr}</span>
          </div>
          <span className="text-emerald-500/30">|</span>
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-400 animate-pulse" />
            <span>NETWORK: BASE L2</span>
          </div>
          <span className="text-emerald-500/30">|</span>
          <div className="text-emerald-400">
            RTP: <strong className="text-emerald-200 font-bold">96.00%</strong>
          </div>
        </div>

        {/* Right: Mode & Vault Balance */}
        <div className="flex items-center gap-2.5">
          {isStandalone ? (
            <div className="flex items-center gap-1.5 text-amber-300 bg-amber-950/40 border border-amber-500/40 px-2.5 py-1 rounded text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>STANDALONE DEMO (MOCK VRF)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 border border-emerald-500/50 px-2.5 py-1 rounded text-[11px] font-semibold">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>CHAIN.WTF CONNECTED</span>
            </div>
          )}

          <div className="bg-black/60 border border-emerald-500/40 px-3 py-1 rounded text-right">
            <div className="text-[9px] text-emerald-500/70 uppercase">VAULT BALANCE</div>
            <div className="text-xs font-bold text-emerald-200">
              {smartVaultBalance ? `${parseFloat(smartVaultBalance).toFixed(2)} USDC` : '1,000.00 USDC'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
