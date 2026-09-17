// src/bridge/types.ts
// Canonical types matching @chain/casino-sdk/guest

export type HexString = `0x${string}`;

export type SessionPhaseName =
  | 'NONE'
  | 'WAITING_RANDOMNESS'
  | 'WAITING_PLAYER_ACTION'
  | 'SETTLED'
  | 'FORFEITED'
  | 'CANCELLED';

export enum SessionPhase {
  NONE = 0,
  WAITING_RANDOMNESS = 1,
  WAITING_PLAYER_ACTION = 2,
  SETTLED = 3,
  FORFEITED = 4,
  CANCELLED = 5,
}

export type CasinoGameManifestV1 = {
  schemaVersion: 1;
  gameId: string;
  apiVersion: 1;
  defaultLocale: string;
  locales: Record<
    string,
    {
      name: string;
      description?: string;
    }
  >;
  assets?: {
    iconUrl?: string;
    coverUrl?: string;
  };
};

export type HostSnapshotV1 = {
  apiVersion: number;
  integration: {
    chainId: number;
    slug: string;
    gameAddress: `0x${string}`;
    manifest: CasinoGameManifestV1;
  };
  wallet: {
    address?: `0x${string}`;
    smartVaultAddress?: `0x${string}`;
    status: 'ready' | 'disconnected' | 'setup-required' | 'session-key-mismatch';
  };
  token: {
    symbol?: string;
    decimals?: number;
  };
  balances: {
    smartVaultBalance?: string;
  };
  casino?: {
    availableLiquidity?: string;
    maxBetRiskBps?: number;
    maxAllowedReservedProfit?: string;
    maxBetAmount?: string;
  };
  sessions: {
    items: Array<{
      sessionId: string;
      sessionKey: string;
      gameAddress: `0x${string}`;
      phase?: number;
      phaseName?: SessionPhaseName;
      wager?: string;
      stake?: string;
      payout?: string;
      isSettled: boolean;
      openedAt?: number;
      settledAt?: number;
      lastEventTimestamp: number;
      raw: {
        gameData?: HexString;
        gameState?: HexString;
        randomness?: HexString;
        requestId?: HexString;
      };
    }>;
  };
  ui: {
    locale: string;
    theme: 'light' | 'dark' | 'system';
    viewport?: {
      availableHeight: number;
    };
  };
};

export type HostApiV1 = {
  reportContentSize?(input: { minHeight: number }): Promise<void>;
  openSession(input: {
    wager: string;
    gameData: HexString;
    randomnessRequestData?: HexString;
  }): Promise<{ sessionKey: string; transactionHash: HexString }>;
  submitAction(input: {
    sessionId: string;
    actionData: HexString;
    randomnessRequestData?: HexString;
    approvalAmount?: string;
  }): Promise<{ transactionHash: HexString }>;
  cancelStuckRandomness(input: { sessionId: string }): Promise<{ transactionHash: HexString }>;
  revealOutcome(input: { sessionId: string }): Promise<void>;
};

export type GuestApiV1 = {
  setState(snapshot: HostSnapshotV1 | null): Promise<void>;
};
