import assert from 'node:assert/strict';
import test from 'node:test';

import { validateWagerInput } from '../src/engine/wagerValidation.ts';
import { safeDecodeOnChainResult } from '../src/engine/onChainResult.ts';
import { findRecoverableSession } from '../src/bridge/sessionRecovery.ts';

test('validates wagers with token base units without Number precision loss', () => {
  const result = validateWagerInput('9007199254740993.01', {
    balanceBaseUnits: 900719925474099301n,
    maxWagerBaseUnits: 900719925474099301n,
    tokenDecimals: 2,
  });

  assert.deepEqual(result, { ok: true, valueBaseUnits: 900719925474099301n });
});

test('rejects a wager with more precision than the token supports', () => {
  const result = validateWagerInput('1.001', {
    balanceBaseUnits: 1_000_000n,
    maxWagerBaseUnits: 1_000_000n,
    tokenDecimals: 2,
  });

  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /decimal places/i);
});

test('does not invent a standalone outcome when on-chain game state is invalid', () => {
  assert.equal(safeDecodeOnChainResult('0x1234', 18), null);
});

test('recovers the newest unsettled session for this game after an iframe reload', () => {
  const session = findRecoverableSession(
    [
      { sessionKey: 'old', gameAddress: '0x1111111111111111111111111111111111111111', isSettled: false, lastEventTimestamp: 10 },
      { sessionKey: 'settled', gameAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', isSettled: true, lastEventTimestamp: 100 },
      { sessionKey: 'latest', gameAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', isSettled: false, lastEventTimestamp: 20 },
    ],
    '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );

  assert.equal(session?.sessionKey, 'latest');
});
