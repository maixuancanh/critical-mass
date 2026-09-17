// src/bridge/guest.ts
import { WindowMessenger, connect } from 'penpal';
import type { Connection } from 'penpal';
import type { GuestApiV1, HostApiV1 } from './types';

export type { GuestApiV1, HostApiV1, HostSnapshotV1 } from './types';

export type GuestBridgeConnection = Connection<HostApiV1>;

const getAllowedParentOrigins = (): string[] => {
  if (typeof document === 'undefined' || !document.referrer) {
    return ['*'];
  }

  try {
    return [new URL(document.referrer).origin];
  } catch {
    return ['*'];
  }
};

export const connectGameToHost = (methods: GuestApiV1): GuestBridgeConnection =>
  connect<HostApiV1>({
    messenger: new WindowMessenger({
      remoteWindow: window.parent,
      allowedOrigins: getAllowedParentOrigins(),
    }),
    methods,
  });
