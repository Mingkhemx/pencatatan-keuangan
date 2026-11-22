"use client";

import { useEffect, useRef, useState } from "react";
import { formatRupiah } from "@/lib/format";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);

  useEffect(() => {
    const start = currentRef.current;
    const end = value;
    if (start === end) return;

    const duration = 420;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (end - start) * eased);
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{formatRupiah(display)}</span>;
}
