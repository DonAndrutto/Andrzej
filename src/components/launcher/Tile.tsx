"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import styles from "./launcher.module.css";

export function Tile({ href, icon, label, description }: { href: string; icon: string; label: string; description: string }) {
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const held = useRef(false);
  const [position, setPosition] = useState<{ left: number; top?: number; bottom?: number } | null>(null);

  function cancelPress() {
    clearTimeout(timer.current);
    touch.current = null;
  }
  function show() {
    const rect = anchor.current!.getBoundingClientRect();
    const width = Math.min(236, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - 12 - width, (rect.left + rect.right - width) / 2));
    setPosition(rect.bottom + 112 > window.innerHeight
      ? { left, bottom: window.innerHeight - rect.top + 5 }
      : { left, top: rect.bottom + 5 });
  }
  function startPress(e: PointerEvent) {
    held.current = false;
    cancelPress();
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    touch.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => { held.current = true; show(); }, 500);
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  const shown = position !== null;
  useEffect(() => {
    if (!shown) return;
    const close = () => setPosition(null);
    const outside = (e: globalThis.PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [shown]);

  return <div ref={wrap} onPointerLeave={e => { if (e.pointerType === "mouse") setPosition(null); }}>
    <a ref={anchor} href={href} className={styles.tile} aria-describedby={id}
      onPointerEnter={e => { if (e.pointerType === "mouse") show(); }}
      onFocus={e => { if (e.currentTarget.matches(":focus-visible")) show(); }}
      onBlur={() => setPosition(null)}
      onPointerDown={startPress} onPointerUp={cancelPress} onPointerCancel={cancelPress}
      onPointerMove={e => {
        const start = touch.current;
        if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) cancelPress();
      }}
      onContextMenu={e => { if (touch.current || held.current) e.preventDefault(); }}
      onClick={e => {
        if (held.current) { e.preventDefault(); held.current = false; }
      }}>
      <img src={`/launcher-icons/${icon}.png`} width="84" height="84" draggable={false} alt="" />
      <span>{label}</span>
    </a>
    <div role="tooltip" id={id} hidden={!position} style={position ?? undefined} className={styles.tip}>{description}</div>
  </div>;
}
