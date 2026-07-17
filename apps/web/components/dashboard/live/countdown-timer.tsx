'use client';

import { useEffect, useState } from 'react';
import { livePageCopy } from '../../../lib/dashboard';

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function CountdownTimer({
  startTime,
  endTime,
  isLive = false,
}: {
  startTime: string;
  endTime: string;
  isLive?: boolean;
}): React.JSX.Element {
  const [now, setNow] = useState(() => Date.now());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = (): void => {
      setPrefersReducedMotion(media.matches);
    };
    sync();
    media.addEventListener('change', sync);
    return () => {
      media.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [prefersReducedMotion]);

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();

  let label: string = livePageCopy.countdownLabel;
  let value = formatRemaining(startMs - now);

  if (isLive || (now >= startMs && now <= endMs)) {
    label = livePageCopy.countdownLive;
    value = formatRemaining(endMs - now);
  } else if (now > endMs) {
    label = livePageCopy.countdownEnded;
    value = '—';
  }

  return (
    <div
      className="rounded-lg border border-border bg-muted/50 px-3 py-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}
