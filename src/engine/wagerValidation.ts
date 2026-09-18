import { parseUnits } from 'viem';

export type WagerValidation =
  | { ok: true; valueBaseUnits: bigint }
  | { ok: false; error: string };

export type WagerLimits = {
  balanceBaseUnits: bigint;
  maxWagerBaseUnits: bigint;
  tokenDecimals: number;
};

const DECIMAL_WAGER = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

export function validateWagerInput(rawWager: string, limits: WagerLimits): WagerValidation {
  const input = rawWager.trim();
  if (!DECIMAL_WAGER.test(input)) {
    return { ok: false, error: 'Enter a wager greater than 0.' };
  }

  const decimalPart = input.split('.')[1] ?? '';
  if (decimalPart.length > limits.tokenDecimals) {
    return { ok: false, error: `This token supports at most ${limits.tokenDecimals} decimal places.` };
  }

  let valueBaseUnits: bigint;
  try {
    valueBaseUnits = parseUnits(input, limits.tokenDecimals);
  } catch {
    return { ok: false, error: 'Enter a valid wager.' };
  }
  if (valueBaseUnits <= 0n) return { ok: false, error: 'Enter a wager greater than 0.' };
  if (limits.maxWagerBaseUnits <= 0n) {
    return { ok: false, error: 'Wager limits are still loading.' };
  }
  if (valueBaseUnits > limits.maxWagerBaseUnits) {
    return { ok: false, error: 'Wager exceeds the current vault limit.' };
  }
  if (limits.balanceBaseUnits < 0n || valueBaseUnits > limits.balanceBaseUnits) {
    return { ok: false, error: 'Insufficient USDC balance in vault.' };
  }

  return { ok: true, valueBaseUnits };
}
