"use client";

import { useCallback, useSyncExternalStore } from "react";

function formatLocalTime(isoTime: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoTime));
}

export default function LocalMeasuredTime({ isoTime }: { isoTime: string }) {
  const subscribe = useCallback(() => () => undefined, []);
  const getSnapshot = useCallback(() => formatLocalTime(isoTime), [isoTime]);
  const getServerSnapshot = useCallback(() => null, []);

  const formattedTime = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return (
    <time dateTime={isoTime} suppressHydrationWarning>
      {formattedTime ?? "..."}
    </time>
  );
}
