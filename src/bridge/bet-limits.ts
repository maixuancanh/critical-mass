import type { HostSnapshotV1 } from './types';

const BASIS_POINTS = 10_000n;

export type MaxWagerResult =
  | { kind: 'limit'; maxWager: bigint }
  | { kind: 'no-limit' }
  | { kind: 'unknown' };

const toBigIntOrUndefined = (value: string | undefined): bigint | undefined => {
  if (value === undefined) return undefined;
  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};

export const computeMaxWager = (
  snapshot: Pick<HostSnapshotV1, 'casino'> | null | undefined,
  input: { maxMultiplierX: number }
): MaxWagerResult => {
  const casino = snapshot?.casino;
  if (!casino) return { kind: 'unknown' };

  const maxBetAmount = toBigIntOrUndefined(casino.maxBetAmount);
  const wagerCeiling = maxBetAmount && maxBetAmount > 0n ? maxBetAmount : undefined;
  if (!Number.isFinite(input.maxMultiplierX)) {
    return wagerCeiling === undefined
      ? { kind: 'unknown' }
      : { kind: 'limit', maxWager: wagerCeiling };
  }

  const multiplierBps = BigInt(Math.ceil(input.maxMultiplierX * Number(BASIS_POINTS)));
  const reservedProfitBps = multiplierBps - BASIS_POINTS;
  if (reservedProfitBps <= 0n) {
    return wagerCeiling === undefined
      ? { kind: 'no-limit' }
      : { kind: 'limit', maxWager: wagerCeiling };
  }

  const maxReservedProfit = toBigIntOrUndefined(casino.maxAllowedReservedProfit);
  if (maxReservedProfit === undefined) {
    return wagerCeiling === undefined
      ? { kind: 'unknown' }
      : { kind: 'limit', maxWager: wagerCeiling };
  }

  const riskBound = (maxReservedProfit * BASIS_POINTS) / reservedProfitBps;
  return {
    kind: 'limit',
    maxWager: wagerCeiling === undefined || riskBound < wagerCeiling ? riskBound : wagerCeiling,
  };
};
