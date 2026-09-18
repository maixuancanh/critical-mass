export type RecoverableSession = {
  sessionKey: string;
  gameAddress: `0x${string}`;
  isSettled: boolean;
  lastEventTimestamp: number;
};

export function findRecoverableSession<T extends RecoverableSession>(
  sessions: readonly T[],
  gameAddress: `0x${string}`
): T | undefined {
  return sessions
    .filter(session => !session.isSettled && session.gameAddress.toLowerCase() === gameAddress.toLowerCase())
    .sort((a, b) => b.lastEventTimestamp - a.lastEventTimestamp)[0];
}
