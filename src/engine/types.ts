// src/engine/types.ts

export interface Chamber {
  id: number;
  x: number;
  y: number;
  isBreached: boolean;
  isInitialTarget: boolean;
  breachStep: number;
}

export interface ReactorEdge {
  id: number;
  from: number;
  to: number;
  isOpen: boolean;
  type: 'horizontal' | 'vertical';
}

export interface FissionResult {
  startChamber: number;
  clusterSize: number;
  breachedMask: number;
  activeEdgeMask: number;
  multiplier: number;
  payout: string;
  stepSequence: number[]; // order in which chambers breached
}

export const MULTIPLIERS = [
  0,     // 0
  0,     // 1
  0,     // 2
  0.40,  // 3
  0.80,  // 4
  1.50,  // 5
  2.80,  // 6
  5.50,  // 7
  12.00, // 8
  49.25, // 9 (Meltdown Jackpot)
];

export const MULTIPLIER_LABELS = [
  '0x',
  '0x',
  '0x',
  '0.40x',
  '0.80x',
  '1.50x',
  '2.80x',
  '5.50x',
  '12.00x',
  '49.25x (MELTDOWN)',
];
