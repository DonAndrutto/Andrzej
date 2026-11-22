"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import styles from "./launcher.module.css";

export function LibraryUpdate({ locale }: { locale: Locale }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [later, setLater] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !["/", "/pl", "/pl/"].includes(location.pathname)) return;
    if (!["app.arybszleger.com", "localhost", "127.0.0.1"].includes(location.hostname)) return;
    const sw = navigator.serviceWorker;
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    let controller = sw.controller;
    let timer: ReturnType<typeof setInterval>;

    // Reload on replacement, including an update accepted in another tab.
    // The first installation only claims the current page.
    sw.addEventListener("controllerchange", () => {
      if (controller && sw.controller && controller !== sw.controller) location.reload();
      controller = sw.controller;
    }, options);

    sw.register("/library-sw.js", { updateViaCache: "none" }).then(reg => {
      if (listeners.signal.aborted) return;
      function watchInstalling() {
        const worker = reg.installing;
        if (!worker) return;
        const changed = () => {
          if (worker.state === "installed" && reg.active) setWaiting(worker);
          if (worker.state === "redundant") setWaiting(current => current === worker ? null : current);
        };
        worker.addEventListener("statechange", changed, options);
        changed();
      }
      function check() {
        if (document.visibilityState === "hidden" || !navigator.onLine) return;
        if (reg.waiting) setWaiting(reg.waiting);
        if (!reg.installing) void reg.update().catch(() => { /* Retry when connected. */ });
      }
      reg.addEventListener("updatefound", watchInstalling, options);
      watchInstalling();
      check();
      window.addEventListener("online", check, options);
      window.addEventListener("pageshow", check, options);
      document.addEventListener("visibilitychange", check, options);
      timer = setInterval(check, 60_000);
    }).catch(error => console.warn("Offline library unavailable", error));

    return () => { listeners.abort(); clearInterval(timer); };
  }, []);

  if (!waiting || waiting === later) return null;
  const pl = locale === "pl";
  return <aside className={styles.update}>
    <p role="status">{pl ? "Nowa wersja biblioteki jest gotowa." : "A library update is ready."}</p>
    <div>
      <button onClick={() => setLater(waiting)}>{pl ? "Później" : "Later"}</button>
      <button className={styles.apply} onClick={() => waiting.postMessage("APPLY_LIBRARY_UPDATE")}>{pl ? "Zaktualizuj" : "Update now"}</button>
    </div>
  </aside>;
}
