import assert from 'node:assert/strict';
import test from 'node:test';
import { validateWagerInput } from '../src/engine/wagerValidation.ts';

const limits = {
  balanceBaseUnits: 100_000_000n,
  maxWagerBaseUnits: 500_000_000n,
  tokenDecimals: 6,
};

test('rejects negative wager', () => {
  assert.equal(validateWagerInput('-5', limits).ok, false);
});

test('rejects zero and blank wager instead of silently defaulting', () => {
  assert.equal(validateWagerInput('0', limits).ok, false);
  assert.equal(validateWagerInput('', limits).ok, false);
});

test('rejects non-decimal values and scientific notation', () => {
  assert.equal(validateWagerInput('NaN', limits).ok, false);
  assert.equal(validateWagerInput('1e3', limits).ok, false);
});

test('rejects wagers above max or balance', () => {
  assert.equal(validateWagerInput('501', { ...limits, balanceBaseUnits: 1000_000_000n }).ok, false);
  assert.equal(validateWagerInput('101', limits).ok, false);
});

test('accepts a positive wager within limits', () => {
  assert.deepEqual(validateWagerInput('12.50', limits), {
    ok: true,
    valueBaseUnits: 12_500_000n,
  });
});
