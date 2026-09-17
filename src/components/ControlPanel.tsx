// src/components/ControlPanel.tsx
import React, { useState } from 'react';
import { Volume2, VolumeX, Zap, Radio, ShieldCheck, Flame } from 'lucide-react';
import { geigerAudio } from '../audio/GeigerAudio';

interface ControlPanelProps {
  wager: string;
  setWager: (val: string) => void;
  selectedChamber: number;
  setSelectedChamber: (id: number) => void;
  isReacting: boolean;
  onTrigger: () => void;
  walletBalance: string;
  isWalletReady: boolean;
  maxWager: string;
  lastPayout: string | null;
  lastMultiplier: number | null;
  isMeltdown: boolean;
  clusterSize: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  wager,
  setWager,
  selectedChamber,
  setSelectedChamber,
  isReacting,
  onTrigger,
  walletBalance,
  isWalletReady,
  maxWager,
  lastPayout,
  lastMultiplier,
  isMeltdown,
  clusterSize,
}) => {
  const [isMuted, setIsMuted] = useState(geigerAudio.getMuted());

  const handleToggleSound = () => {
    const muted = geigerAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleChamberChange = (idx: number) => {
    if (isReacting) return;
    geigerAudio.playSwitchClunk();
    setSelectedChamber(idx);
  };

  const setChipAmount = (amt: number) => {
    if (isReacting) return;
    geigerAudio.playSwitchClunk();
    setWager(amt.toString());
  };

  const adjustWager = (factor: number) => {
    if (isReacting) return;
    geigerAudio.playSwitchClunk();
    const cur = parseFloat(wager) || 1;
    const max = parseFloat(maxWager) || 500;
    const next = Math.max(1, Math.min(max, Math.round(cur * factor)));
    setWager(next.toString());
  };

  // Compute radiation dosimeter value
  const radiationLevel = isReacting
    ? Math.min(100, 15 + clusterSize * 10)
    : clusterSize === 9
    ? 100
    : clusterSize > 0
    ? Math.min(100, clusterSize * 10)
    : 8;

  return (
    <div className="rounded-xl overflow-hidden metal-bezel p-4 md:p-5 font-mono text-emerald-300 flex flex-col gap-4 shadow-[0_0_35px_rgba(4,120,87,0.2)] border border-emerald-500/40">
      {/* Header Bar: Status & Sound Toggle */}
      <div className="flex justify-between items-center border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider text-xs text-emerald-200">
            FIRING CONSOLE
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-semibold">
            VRF-L2
          </span>
        </div>

        <button
          onClick={handleToggleSound}
          className="px-2 py-1 rounded bg-black/50 border border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-1.5 text-xs transition"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span className="text-[10px]">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>
      </div>

      {/* Radiation Dosimeter Meter */}
      <div className="bg-black/60 rounded-lg p-2.5 border border-emerald-500/20 flex flex-col gap-1">
        <div className="flex justify-between items-center text-[10px] tracking-wider text-emerald-400/80">
          <span>GEIGER RADIATION DOSIMETER</span>
          <span className={radiationLevel > 60 ? 'text-rose-400 font-bold' : 'text-emerald-300'}>
            {(radiationLevel * 4.8).toFixed(1)} mSv/h
          </span>
        </div>
        {/* Segmented LED Bar */}
        <div className="h-3 w-full bg-zinc-950 rounded-sm border border-zinc-800 flex gap-0.5 p-0.5">
          {Array.from({ length: 20 }).map((_, i) => {
            const active = i / 20 < radiationLevel / 100;
            const isRed = i >= 15;
            const isAmber = i >= 10 && i < 15;
            return (
              <div
                key={i}
                className={`flex-1 rounded-[1px] transition-colors duration-150 ${
                  active
                    ? isRed
                      ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                      : isAmber
                      ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                      : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                    : 'bg-zinc-800/40'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Target Chamber Selection */}
      <div>
        <div className="flex justify-between items-center text-xs text-emerald-300 mb-2">
          <span className="font-semibold tracking-wide">TARGET FUEL CHAMBER</span>
          <span className="text-emerald-400/60 text-[11px]">
            ACTIVE: <strong className="text-emerald-300">ROD {selectedChamber + 1}</strong>
          </span>
        </div>

        <div className="grid grid-cols-9 gap-1.5">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(idx => {
            const isSel = selectedChamber === idx;
            return (
              <button
                key={idx}
                disabled={isReacting}
                onClick={() => handleChamberChange(idx)}
                className={`py-2 text-xs font-bold rounded-md border transition-all duration-150 flex flex-col items-center justify-center ${
                  isSel
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105'
                    : 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/40 hover:border-emerald-700'
                }`}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wager Input & Quick Chips */}
      <div>
        <div className="flex justify-between items-center text-xs text-emerald-300 mb-1.5">
          <span className="font-semibold tracking-wide">WAGER (USDC)</span>
          <span className="text-emerald-400/70 text-[11px]">
            VAULT: <strong className="text-emerald-300">{parseFloat(walletBalance).toFixed(2)}</strong>
          </span>
        </div>

        {/* Input Box & Multiplier Buttons */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max={maxWager}
              step="1"
              disabled={isReacting}
              value={wager}
              onChange={e => setWager(e.target.value)}
              className="w-full bg-black/90 border border-emerald-500/50 rounded-lg px-3 py-2 text-emerald-200 font-mono text-base font-bold focus:outline-none focus:border-emerald-400 focus:shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            />
            <span className="absolute right-3 top-2.5 text-xs text-emerald-500/50 font-bold">
              USDC
            </span>
          </div>

          <button
            disabled={isReacting}
            onClick={() => adjustWager(0.5)}
            className="px-3 py-2 text-xs font-bold bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 text-emerald-300 transition"
          >
            ½
          </button>
          <button
            disabled={isReacting}
            onClick={() => adjustWager(2)}
            className="px-3 py-2 text-xs font-bold bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 text-emerald-300 transition"
          >
            2×
          </button>
          <button
            disabled={isReacting}
            onClick={() => setWager(Math.min(500, parseFloat(walletBalance) || 500).toFixed(0))}
            className="px-3 py-2 text-xs font-bold bg-emerald-950/40 border border-emerald-800/60 rounded-lg hover:bg-emerald-900/40 text-emerald-300 transition"
          >
            MAX
          </button>
        </div>

        {/* Neon Energy Chip Selectors */}
        <div className="grid grid-cols-5 gap-1.5 mt-2">
          {[5, 10, 25, 50, 100].map(amt => (
            <button
              key={amt}
              disabled={isReacting}
              onClick={() => setChipAmount(amt)}
              className={`py-1.5 text-xs rounded border transition font-bold ${
                parseFloat(wager) === amt
                  ? 'bg-amber-500/30 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'bg-black/50 border-emerald-900/50 hover:bg-emerald-950/50 text-emerald-400/80'
              }`}
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Outcome Result Box */}
      {lastPayout !== null && !isReacting && (
        <div
          className={`p-3 rounded-lg border font-mono transition-all ${
            isMeltdown
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse'
              : parseFloat(lastPayout) > 0
              ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-zinc-950/80 border-zinc-800 text-zinc-400'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5">
              {isMeltdown ? (
                <Flame size={16} className="text-rose-400" />
              ) : (
                <ShieldCheck size={16} className={parseFloat(lastPayout) > 0 ? 'text-amber-400' : 'text-zinc-400'} />
              )}
              {isMeltdown
                ? '★ CRITICAL MELTDOWN JACKPOT ★'
                : parseFloat(lastPayout) > 0
                ? 'FISSION CHAIN PROPAGATED'
                : 'CONTAINMENT STABLE (NO YIELD)'}
            </span>
            <span className="text-xs opacity-75">
              {clusterSize}/9 CHAMBERS
            </span>
          </div>
          <div className="text-lg font-bold mt-1 text-center">
            {parseFloat(lastPayout) > 0 ? (
              <span className="text-emerald-300 font-extrabold text-xl">
                +{lastPayout} USDC ({lastMultiplier?.toFixed(2)}x)
              </span>
            ) : (
              <span className="text-zinc-500">0.00 USDC (0.00x)</span>
            )}
          </div>
        </div>
      )}

      {/* Heavy Industrial Trigger Button */}
      <div className="relative pt-1">
        <button
          disabled={isReacting || !isWalletReady}
          onClick={onTrigger}
          className={`w-full py-4 px-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all duration-150 flex items-center justify-center gap-3 border-2 shadow-lg ${
            isReacting
              ? 'bg-amber-600/30 border-amber-500 text-amber-300 cursor-not-allowed animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              : !isWalletReady
              ? 'bg-zinc-900 border-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 border-emerald-300 text-black hover:from-emerald-400 hover:to-teal-300 shadow-[0_0_30px_rgba(16,185,129,0.7)] active:scale-95 active:shadow-[0_0_15px_rgba(16,185,129,0.9)]'
          }`}
        >
          <Zap size={20} className={isReacting ? 'animate-spin' : ''} />
          <span>
            {isReacting
              ? 'CASCADE IN PROGRESS...'
              : !isWalletReady
              ? 'AWAITING WALLET...'
              : `TRIGGER FISSION // ${wager} USDC`}
          </span>
        </button>
      </div>
    </div>
  );
};
