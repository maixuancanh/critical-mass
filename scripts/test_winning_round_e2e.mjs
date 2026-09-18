import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeAbiParameters, parseUnits } from 'viem';

import { safeDecodeOnChainResult } from '../src/engine/onChainResult.ts';
import { parseOnChainResult } from '../src/engine/reactorSimulation.ts';
import { validateWagerInput } from '../src/engine/wagerValidation.ts';
import { computeMaxWager } from '../src/bridge/bet-limits.ts';
import { findRecoverableSession } from '../src/bridge/sessionRecovery.ts';

test('Critical Mass E2E: Winning Round (5-chamber cluster) settlement with 6 decimals (USDC)', () => {
  const tokenDecimals = 6;
  const wagerInput = '10.50';
  const wagerBaseUnits = parseUnits(wagerInput, tokenDecimals); // 10_500_000n
  assert.equal(wagerBaseUnits, 10_500_000n);

  // Validate wager input using base units
  const validation = validateWagerInput(wagerInput, {
    balanceBaseUnits: 100_000_000n, // 100 USDC
    maxWagerBaseUnits: 50_000_000n, // 50 USDC
    tokenDecimals,
  });
  assert.equal(validation.ok, true);
  if (validation.ok) {
    assert.equal(validation.valueBaseUnits, 10_500_000n);
  }

  // Multiplier for cluster size 5 is 4.0x
  const multiplierWad = 4_000_000_000_000_000_000n;
  const payoutBaseUnits = (wagerBaseUnits * multiplierWad) / 10n ** 18n; // 42_000_000n
  assert.equal(payoutBaseUnits, 42_000_000n);

  // Encode on-chain gameState as CriticalMass.sol does
  const startChamber = 4;
  const clusterSize = 5;
  const visitedMask = 0b000011111;
  const activeEdgeMask = 0b101010111100;
  const gameStateHex = encodeAbiParameters(
    [
      { type: 'uint8' },
      { type: 'uint8' },
      { type: 'uint16' },
      { type: 'uint32' },
      { type: 'uint256' },
      { type: 'uint256' },
    ],
    [startChamber, clusterSize, visitedMask, activeEdgeMask, multiplierWad, payoutBaseUnits]
  );

  // Decode on-chain outcome via safe parser
  const result = parseOnChainResult(gameStateHex, tokenDecimals);
  assert.ok(result, 'Result should decode cleanly');
  assert.equal(result.startChamber, 4);
  assert.equal(result.clusterSize, 5);
  assert.equal(result.multiplier, 4.0);
  assert.equal(result.payout, '42.00');
  assert.ok(result.stepSequence.length > 0, 'Should build valid step sequence');
});

test('Critical Mass E2E: Meltdown Jackpot (9-chamber cluster) settlement with 18 decimals', () => {
  const tokenDecimals = 18;
  const wagerInput = '5';
  const wagerBaseUnits = parseUnits(wagerInput, tokenDecimals); // 5e18

  // Jackpot multiplier: 49.250439152323925x
  const multiplierWad = 49_250_439_152_323_925_000n;
  const payoutBaseUnits = (wagerBaseUnits * multiplierWad) / 10n ** 18n;

  const gameStateHex = encodeAbiParameters(
    [
      { type: 'uint8' },
      { type: 'uint8' },
      { type: 'uint16' },
      { type: 'uint32' },
      { type: 'uint256' },
      { type: 'uint256' },
    ],
    [0, 9, 0b111111111, 0x3ffff, multiplierWad, payoutBaseUnits]
  );

  const result = safeDecodeOnChainResult(gameStateHex, tokenDecimals);
  assert.ok(result);
  assert.equal(result.clusterSize, 9);
  assert.ok(result.multiplier > 49.25);
  assert.equal(result.payout, '246.25'); // 5 * 49.250439...
});

test('Critical Mass E2E: Corrupted state fails closed and returns null (never fakes outcome)', () => {
  const corruptedHex = '0xdeadbeef';
  const result = parseOnChainResult(corruptedHex, 6);
  assert.equal(result, null, 'Must strictly return null when decode fails');
});

test('Critical Mass E2E: Risk cap computation fails closed when limits are undefined', () => {
  const emptySnapshot = { casino: {} };
  const capResult = computeMaxWager(emptySnapshot, { maxMultiplierX: 49.25 });
  assert.equal(capResult.kind, 'unknown');
});

test('Critical Mass E2E: Session recovery retrieves unsettled winning session after reload', () => {
  const gameAddr = '0x1234567890123456789012345678901234567890';
  const sessions = [
    {
      sessionKey: 'pending-win',
      gameAddress: gameAddr,
      isSettled: false,
      lastEventTimestamp: 200,
    },
    {
      sessionKey: 'old-settled',
      gameAddress: gameAddr,
      isSettled: true,
      lastEventTimestamp: 100,
    },
  ];
  const recovered = findRecoverableSession(sessions, gameAddr);
  assert.equal(recovered?.sessionKey, 'pending-win');
});
