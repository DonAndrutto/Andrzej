"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import styles from "./launcher.module.css";

export function ExperimentDrawer({ children, experiments, locale }: { children: ReactNode; experiments: ReactNode; locale: Locale }) {
  const scroll = useRef<HTMLElement>(null);
  const drawer = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const focusOnOpen = useRef(false);

  useEffect(() => {
    if (location.hostname === "app.arybszleger.com" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/library-sw.js").catch(error => console.warn("Offline library unavailable", error));
    }
  }, []);

  useEffect(() => {
    const el = scroll.current;
    if (!el || open) return;
    const bottom = () => el.scrollHeight - el.clientHeight - el.scrollTop < 4;
    let start: Touch | undefined;
    let lastWheel = -Infinity;
    let wheelDistance = 0;
    let armed = false;
    function touchStart(e: TouchEvent) {
      start = e.touches.length === 1 && bottom() ? e.touches[0] : undefined;
    }
    function touchEnd(e: TouchEvent) {
      const end = e.changedTouches[0];
      if (start && end && start.clientY - end.clientY > 74 && Math.abs(end.clientX - start.clientX) < start.clientY - end.clientY && bottom()) setOpen(true);
      start = undefined;
    }
    function wheel(e: WheelEvent) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.timeStamp - lastWheel > 170 || e.deltaY < 0) {
        wheelDistance = 0;
        armed = bottom() && e.deltaY > 0;
      }
      lastWheel = e.timeStamp;
      if (!armed || !bottom()) return;
      wheelDistance += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el!.clientHeight : 1);
      if (wheelDistance > 105) setOpen(true);
    }
    el.addEventListener("touchstart", touchStart, { passive: true });
    el.addEventListener("touchend", touchEnd, { passive: true });
    el.addEventListener("wheel", wheel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchend", touchEnd);
      el.removeEventListener("wheel", wheel);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen.current) drawer.current?.querySelector("h2")?.focus({ preventScroll: true });
    drawer.current?.scrollIntoView({ block: "end", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [open]);

  return <main ref={scroll} className={styles.scroller}>
    <div className={styles.screen}>
      {children}
      <button className={styles.pull} hidden={open} aria-expanded={open} aria-controls="experimental-apps"
        aria-label={locale === "pl" ? "Odkryj eksperymenty" : "Reveal experiments"}
        onClick={() => { focusOnOpen.current = true; setOpen(true); }}>
        <span aria-hidden="true" />
      </button>
    </div>
    <div ref={drawer} id="experimental-apps" hidden={!open}>{experiments}</div>
  </main>;
}
