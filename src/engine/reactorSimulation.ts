// src/engine/reactorSimulation.ts
import { FissionResult, MULTIPLIERS } from './types';
import { decodeAbiParameters } from 'viem';

export const PERCOLATION_THRESHOLD = 51;

// 3x3 Torus 18 edges definition
export const TORUS_EDGES: Array<{ from: number; to: number }> = [];
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    const u = y * 3 + x;
    TORUS_EDGES.push({ from: u, to: y * 3 + ((x + 1) % 3) });     // Horizontal right
    TORUS_EDGES.push({ from: u, to: ((y + 1) % 3) * 3 + x });     // Vertical down
  }
}

// Client BFS simulation matching CriticalMass.sol exactly
export function runFissionBFS(startChamber: number, activeEdgeMask: number): {
  clusterSize: number;
  visitedMask: number;
  stepSequence: number[];
} {
  let visitedMask = 1 << startChamber;
  const queue = [startChamber];
  const stepSequence: number[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    stepSequence.push(cur);

    const x = cur % 3;
    const y = Math.floor(cur / 3);

    // Neighbor 0: Right
    const n0 = y * 3 + ((x + 1) % 3);
    const e0 = 2 * cur;
    if ((activeEdgeMask & (1 << e0)) !== 0 && (visitedMask & (1 << n0)) === 0) {
      visitedMask |= (1 << n0);
      queue.push(n0);
    }

    // Neighbor 1: Down
    const n1 = ((y + 1) % 3) * 3 + x;
    const e1 = 2 * cur + 1;
    if ((activeEdgeMask & (1 << e1)) !== 0 && (visitedMask & (1 << n1)) === 0) {
      visitedMask |= (1 << n1);
      queue.push(n1);
    }

    // Neighbor 2: Left
    const n2 = y * 3 + ((x + 2) % 3);
    const e2 = 2 * n2;
    if ((activeEdgeMask & (1 << e2)) !== 0 && (visitedMask & (1 << n2)) === 0) {
      visitedMask |= (1 << n2);
      queue.push(n2);
    }

    // Neighbor 3: Up
    const n3 = ((y + 2) % 3) * 3 + x;
    const e3 = 2 * n3 + 1;
    if ((activeEdgeMask & (1 << e3)) !== 0 && (visitedMask & (1 << n3)) === 0) {
      visitedMask |= (1 << n3);
      queue.push(n3);
    }
  }

  return {
    clusterSize: stepSequence.length,
    visitedMask,
    stepSequence,
  };
}

// Simulates a round locally for standalone demo mode
export function simulateStandaloneRound(startChamber: number, wager: number): FissionResult {
  const randomBytes = new Uint8Array(18);
  crypto.getRandomValues(randomBytes);

  let activeEdgeMask = 0;
  for (let e = 0; e < 18; e++) {
    if (randomBytes[e] < PERCOLATION_THRESHOLD) {
      activeEdgeMask |= (1 << e);
    }
  }

  const { clusterSize, visitedMask, stepSequence } = runFissionBFS(startChamber, activeEdgeMask);
  const multiplier = MULTIPLIERS[clusterSize] || 0;
  const payout = (wager * multiplier).toFixed(2);

  return {
    startChamber,
    clusterSize,
    breachedMask: visitedMask,
    activeEdgeMask,
    multiplier,
    payout,
    stepSequence,
  };
}

// Decodes raw on-chain gameState from CriticalMass.sol
export function parseOnChainResult(gameStateHex: `0x${string}`, wagerHuman: number): FissionResult {
  try {
    const decoded = decodeAbiParameters(
      [
        { type: 'uint8', name: 'startChamber' },
        { type: 'uint8', name: 'clusterSize' },
        { type: 'uint16', name: 'visitedMask' },
        { type: 'uint32', name: 'activeEdgeMask' },
        { type: 'uint256', name: 'multiplierWad' },
        { type: 'uint256', name: 'payout' },
      ],
      gameStateHex
    );

    const startChamber = Number(decoded[0]);
    const clusterSize = Number(decoded[1]);
    const visitedMask = Number(decoded[2]);
    const activeEdgeMask = Number(decoded[3]);
    const multiplier = Number(decoded[4]) / 1e18;
    const payout = (wagerHuman * multiplier).toFixed(2);

    const { stepSequence } = runFissionBFS(startChamber, activeEdgeMask);

    return {
      startChamber,
      clusterSize,
      breachedMask: visitedMask,
      activeEdgeMask,
      multiplier,
      payout,
      stepSequence,
    };
  } catch (err) {
    console.error('Failed to decode on-chain gameState:', err);
    return simulateStandaloneRound(0, wagerHuman);
  }
}
