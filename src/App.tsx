// src/App.tsx
import React, { useEffect, useState, useRef } from 'react';
import { StandaloneBanner } from './components/StandaloneBanner';
import { ReactorCanvas } from './components/ReactorCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PayoutLadder } from './components/PayoutLadder';
import { geigerAudio } from './audio/GeigerAudio';
import {
  simulateStandaloneRound,
  parseOnChainResult,
} from './engine/reactorSimulation';
import { validateWagerInput } from './engine/wagerValidation';
import { FissionResult } from './engine/types';
import { findRecoverableSession } from './bridge/sessionRecovery';
import {
  connectGameToHost,
  computeMaxWager,
  observeGameContentSize,
  type GuestApiV1,
  type HostApiV1,
  type HostSnapshotV1,
} from './bridge/guest';
import confetti from 'canvas-confetti';
import { encodeAbiParameters, formatUnits } from 'viem';
import { Shield, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Bridge & Host State
  const [hostApi, setHostApi] = useState<HostApiV1 | null>(null);
  const [snapshot, setSnapshot] = useState<HostSnapshotV1 | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);

  // Standalone Mock State
  const [mockBalance, setMockBalance] = useState<number>(1000);

  // Gameplay State
  const [wager, setWager] = useState<string>('10');
  const [selectedChamber, setSelectedChamber] = useState<number>(4); // Center chamber (CH-5) default
  const [isReacting, setIsReacting] = useState<boolean>(false);

  // Animation State
  const [breachedChambers, setBreachedChambers] = useState<Set<number>>(new Set());
  const [activeEdges, setActiveEdges] = useState<Set<number>>(new Set());
  const [animatingEdges, setAnimatingEdges] = useState<
    Array<{ from: number; to: number; progress: number }>
  >([]);
  const [liveClusterSize, setLiveClusterSize] = useState<number>(0);

  // Outcome
  const [lastPayout, setLastPayout] = useState<string | null>(null);
  const [lastMultiplier, setLastMultiplier] = useState<number | null>(null);
  const [isMeltdown, setIsMeltdown] = useState<boolean>(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  const activeSessionIdRef = useRef<string | null>(null);
  const failedSessionRef = useRef<{ sessionKey: string; sessionId: string; gameState: `0x${string}` } | null>(null);

  const handleRetrySettlement = () => {
    if (!failedSessionRef.current || !snapshot) return;
    const { gameState, sessionId } = failedSessionRef.current;
    const result = parseOnChainResult(gameState, snapshot.token.decimals ?? 18);
    if (!result) {
      setSettlementError(`Session ${sessionId} settled, but its result could not be verified.`);
      return;
    }
    setSettlementError(null);
    failedSessionRef.current = null;
    playReactionSequence(result, sessionId);
  };

  // 1. Connect to Host or Fallback to Standalone Demo Mode
  useEffect(() => {
    let mounted = true;
    let connection: ReturnType<typeof connectGameToHost> | null = null;
    const isInIframe = typeof window !== 'undefined' && window !== window.parent;

    if (!isInIframe) {
      setIsStandalone(true);
    } else {
      const guestMethods: GuestApiV1 = {
        async setState(nextSnapshot) {
          if (!mounted || !nextSnapshot) return;
          setSnapshot(nextSnapshot);
          setIsStandalone(false);
        },
      };

      try {
        connection = connectGameToHost(guestMethods);

        const timeout = setTimeout(() => {
          if (mounted && !snapshot) setIsStandalone(true);
        }, 2000);

        void connection.promise
          .then(parent => {
            if (mounted) {
              clearTimeout(timeout);
              setHostApi(parent);
              setIsStandalone(false);
            }
          })
          .catch(() => {
            if (mounted) setIsStandalone(true);
          });
      } catch {
        if (mounted) setIsStandalone(true);
      }
    }

    geigerAudio.startBackground();

    return () => {
      mounted = false;
      connection?.destroy();
      geigerAudio.stopBackground();
    };
  }, []);

  useEffect(() => {
    const observer = observeGameContentSize(hostApi);
    return () => observer.disconnect();
  }, [hostApi]);

  // 2. Restore a pending host session after an iframe refresh.
  useEffect(() => {
    if (!snapshot || activeSessionIdRef.current) return;
    const recoverable = findRecoverableSession(
      snapshot.sessions.items,
      snapshot.integration.gameAddress
    );
    if (recoverable) activeSessionIdRef.current = recoverable.sessionKey;
  }, [snapshot]);

  // 3. Watch for Host Session Settled
  useEffect(() => {
    if (!snapshot || !activeSessionIdRef.current) return;

    const currentSession = snapshot.sessions.items.find(
        s => s.sessionKey === activeSessionIdRef.current
    );

    if (currentSession && currentSession.isSettled && currentSession.raw.gameState) {
      activeSessionIdRef.current = null;
      const result = parseOnChainResult(currentSession.raw.gameState, snapshot.token.decimals ?? 18);
      if (!result) {
        failedSessionRef.current = {
          sessionKey: currentSession.sessionKey,
          sessionId: currentSession.sessionId,
          gameState: currentSession.raw.gameState,
        };
        setSettlementError(`Session ${currentSession.sessionId} settled, but its result could not be verified.`);
        setIsReacting(false);
        return;
      }
      failedSessionRef.current = null;
      setSettlementError(null);
      playReactionSequence(result, currentSession.sessionId);
    }
  }, [snapshot]);

  // 4. Fission Reaction Animation Sequence
  const playReactionSequence = async (result: FissionResult, sessionId?: string) => {
    setIsReacting(true);
    setBreachedChambers(new Set([result.startChamber]));
    setLiveClusterSize(1);
    setIsMeltdown(false);

    // Unpack active edges
    const edgesSet = new Set<number>();
    for (let e = 0; e < 18; e++) {
      if ((result.activeEdgeMask & (1 << e)) !== 0) {
        edgesSet.add(e);
      }
    }
    setActiveEdges(edgesSet);

    // Sequential chamber breach animation
    const sequence = result.stepSequence;
    for (let i = 0; i < sequence.length; i++) {
      const chamber = sequence[i];
      setBreachedChambers(prev => new Set([...prev, chamber]));
      setLiveClusterSize(i + 1);

      geigerAudio.playChamberBreach(chamber, i + 1);
      geigerAudio.playGeigerClick(1.5 + (i + 1) * 0.25);

      if (i + 1 >= 7) {
        geigerAudio.playCriticalAlarm();
      }

      await new Promise(r => setTimeout(r, 240));
    }

    // Meltdown Jackpot Check
    if (result.clusterSize === 9) {
      setIsMeltdown(true);
      geigerAudio.playMeltdownJackpot();
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#ff0055', '#ff9900', '#00ff88', '#ffffff', '#ffd700'],
      });
    }

    setLastPayout(result.payout);
    setLastMultiplier(result.multiplier);

    // Settle balance
    if (isStandalone) {
      const wagerNum = parseFloat(wager) || 10;
      const winNum = parseFloat(result.payout) || 0;
      setMockBalance(prev => Math.max(0, prev - wagerNum + winNum));
    } else if (hostApi && sessionId) {
      await hostApi.revealOutcome({ sessionId });
    }

    setIsReacting(false);
  };

  // 5. Trigger Fission Action
  const handleTrigger = async () => {
    if (isReacting) return;
    const decimals = snapshot?.token.decimals ?? 18;
    const balanceBaseUnits = isStandalone
      ? BigInt(Math.round(mockBalance * 10 ** decimals))
      : BigInt(snapshot?.balances.smartVaultBalance || '0');
    if (!maxWagerBaseUnits) {
      setSettlementError('Vault wager limits are still loading. Please wait.');
      return;
    }
    const wagerValidation = validateWagerInput(wager, {
      balanceBaseUnits,
      maxWagerBaseUnits,
      tokenDecimals: decimals,
    });
    if (!wagerValidation.ok) {
      alert(wagerValidation.error);
      return;
    }
    const wagerNum = Number(formatUnits(wagerValidation.valueBaseUnits, decimals));
    setSettlementError(null);

    geigerAudio.playDischarge();

    if (isStandalone || !hostApi || !snapshot) {
      // Standalone simulation with real random values
      const result = simulateStandaloneRound(selectedChamber, wagerNum);
      await playReactionSequence(result);
    } else {
      // On-chain via Chain SDK Host
      try {
        setIsReacting(true);
        const gameData = encodeAbiParameters([{ type: 'uint8' }], [selectedChamber]);

        const { sessionKey } = await hostApi.openSession({
          wager: wagerValidation.valueBaseUnits.toString(),
          gameData,
        });

        activeSessionIdRef.current = sessionKey;
      } catch (err) {
        console.error('Failed to open on-chain session:', err);
        setIsReacting(false);
      }
    }
  };

  const walletBalance = isStandalone
    ? mockBalance.toString()
    : snapshot
      ? formatUnits(BigInt(snapshot.balances.smartVaultBalance || '0'), snapshot.token.decimals ?? 18)
      : '0';

  const maxWagerBaseUnits = (() => {
    if (isStandalone) return 500_000_000_000_000_000_000n;
    if (!snapshot) return null;
    const result = computeMaxWager(snapshot, { maxMultiplierX: 49.250439152323925 });
    return result.kind === 'limit' ? result.maxWager : null;
  })();
  const platformMaxWager = maxWagerBaseUnits
    ? formatUnits(maxWagerBaseUnits, snapshot?.token.decimals ?? 18)
    : '—';

  const isWalletReady = isStandalone ? true : snapshot?.wallet.status === 'ready' && maxWagerBaseUnits !== null;

  return (
    <div className="min-h-screen nuclear-facility-bg text-emerald-300 flex flex-col font-mono selection:bg-emerald-500 selection:text-black">
      {/* Top Banner Header */}
      <StandaloneBanner
        isStandalone={isStandalone}
        walletAddress={snapshot?.wallet.address}
        smartVaultBalance={walletBalance}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Canvas Monitor */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <ReactorCanvas
              selectedChamber={selectedChamber}
              breachedChambers={breachedChambers}
              activeEdges={activeEdges}
              animatingEdges={animatingEdges}
              isReacting={isReacting}
              onSelectChamber={setSelectedChamber}
              clusterSize={liveClusterSize}
            />

            {/* Sub-monitor instruction bar */}
            <div className="bg-black/50 border border-emerald-500/20 rounded-lg px-3 py-2 text-xs flex justify-between items-center text-emerald-400/80">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                <span>CLICK ANY CORE CHAMBER (1–9) TO SELECT INJECTION TARGET</span>
              </span>
              <span className="text-[10px] text-emerald-500/60 hidden sm:inline">
                TOROIDAL TOPOLOGY // SYMMETRIC EV
              </span>
            </div>
          </div>

          {/* Right Column: Firing Console & Yield Telemetry */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <ControlPanel
              wager={wager}
              setWager={setWager}
              selectedChamber={selectedChamber}
              setSelectedChamber={setSelectedChamber}
              isReacting={isReacting}
              onTrigger={handleTrigger}
              walletBalance={walletBalance}
              isWalletReady={isWalletReady}
              maxWager={platformMaxWager.toString()}
              lastPayout={lastPayout}
              lastMultiplier={lastMultiplier}
              isMeltdown={isMeltdown}
              clusterSize={liveClusterSize}
              settlementError={settlementError}
              onRetrySettlement={handleRetrySettlement}
              isRiskCapLoading={!isStandalone && maxWagerBaseUnits === null}
            />

            <PayoutLadder
              currentClusterSize={liveClusterSize}
              isReacting={isReacting}
              wager={wager}
            />
          </div>
        </div>

        {/* Technical Footer */}
        <footer className="mt-auto border-t border-emerald-500/20 pt-4 text-xs text-emerald-500/60 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            <span>CRITICAL MASS © 2026 // CHAIN CASINO SDK // BASE L2</span>
          </div>

          <div className="flex flex-wrap gap-4 text-[11px]">
            <span>THEORETICAL RTP: <strong className="text-emerald-300">96.0000%</strong></span>
            <span>VRF: <strong className="text-emerald-300">UNBIASED REJECTION</strong></span>
            <span>INTEGER DRIFT: <strong className="text-emerald-300">-1 wei</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
};
