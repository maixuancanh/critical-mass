// src/bridge/guest.ts
import { WindowMessenger, connect } from 'penpal';
import type { Connection } from 'penpal';
import type { GuestApiV1, HostApiV1 } from './types';

export type { GuestApiV1, HostApiV1, HostSnapshotV1 } from './types';
export { computeMaxWager } from './bet-limits';

export type GuestBridgeConnection = Connection<HostApiV1>;

export const observeGameContentSize = (
  hostApi: Pick<HostApiV1, 'reportContentSize'> | null | undefined
): { disconnect(): void } => {
  if (typeof ResizeObserver === 'undefined' || !hostApi?.reportContentSize) {
    return { disconnect() {} };
  }
  let frame = 0;
  const report = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const minHeight = Math.ceil(
        Math.max(document.body?.scrollHeight ?? 0, document.documentElement.scrollHeight)
      );
      void hostApi.reportContentSize?.({ minHeight }).catch(() => {});
    });
  };
  const observer = new ResizeObserver(report);
  observer.observe(document.documentElement);
  report();
  return {
    disconnect() {
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
  };
};

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
