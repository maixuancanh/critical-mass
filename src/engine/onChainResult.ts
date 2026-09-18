import { decodeAbiParameters, formatUnits } from 'viem';
import type { FissionResult } from './types.ts';

export function safeDecodeOnChainResult(
  gameStateHex: `0x${string}`,
  tokenDecimals = 18
): FissionResult | null {
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
    if (startChamber > 8 || clusterSize < 1 || clusterSize > 9 || visitedMask === 0) return null;
    const payout = Number(formatUnits(decoded[5], tokenDecimals)).toFixed(2);
    return {
      startChamber,
      clusterSize,
      breachedMask: visitedMask,
      activeEdgeMask,
      multiplier: Number(decoded[4]) / 1e18,
      payout,
      stepSequence: [],
    };
  } catch {
    return null;
  }
}
