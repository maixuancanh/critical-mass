// src/components/PayoutLadder.tsx
import React from 'react';
import { MULTIPLIERS } from '../engine/types';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface PayoutLadderProps {
  currentClusterSize: number;
  isReacting: boolean;
  wager: string;
}

export const PayoutLadder: React.FC<PayoutLadderProps> = ({
  currentClusterSize,
  wager,
}) => {
  const wagerNum = parseFloat(wager) || 10;

  return (
    <div className="rounded-xl overflow-hidden metal-bezel p-4 font-mono text-emerald-300 shadow-[0_0_25px_rgba(4,120,87,0.15)] border border-emerald-500/30">
      {/* Title Bar */}
      <div className="flex justify-between items-center border-b border-emerald-500/20 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-emerald-400" />
          <span className="font-bold tracking-wider text-xs text-emerald-200">
            FISSION YIELD TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-emerald-500/70">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
          <span>PROVABLE RTP: 96.00%</span>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(tier => {
          const mult = MULTIPLIERS[tier];
          const isReached = currentClusterSize >= tier;
          const isCurrent = currentClusterSize === tier;
          const isMeltdown = tier === 9;
          const payoutAmount = (wagerNum * mult).toFixed(1);

          return (
            <div
              key={tier}
              className={`p-2 rounded-lg border transition-all duration-200 flex flex-col justify-between ${
                isCurrent
                  ? isMeltdown
                    ? 'bg-rose-950/90 border-rose-400 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.8)] scale-105 z-10'
                    : 'bg-amber-950/80 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.6)] scale-105 z-10'
                  : isReached
                  ? 'bg-emerald-900/40 border-emerald-500/60 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'bg-black/50 border-emerald-950 text-emerald-700/50'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-center text-[10px] tracking-tight">
                <span className={isCurrent ? 'font-bold' : 'opacity-80'}>
                  {tier === 9 ? 'MELTDOWN' : `CHAMBER ${tier}`}
                </span>
                {isMeltdown && (
                  <AlertTriangle size={12} className="text-rose-400 animate-bounce" />
                )}
              </div>

              {/* Multiplier Value */}
              <div className="text-base font-extrabold my-0.5 tracking-tight">
                {mult > 0 ? `${mult.toFixed(2)}x` : '0x'}
              </div>

              {/* Projected USDC Win */}
              <div className="text-[10px] opacity-75 truncate">
                {mult > 0 ? `→ $${payoutAmount}` : 'NO PAYOUT'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
