"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import styles from "./launcher.module.css";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
type Guide = "ios" | "safari" | "browser";

export function InstallLibrary({ locale }: { locale: Locale }) {
  const pl = locale === "pl";
  const dialog = useRef<HTMLDialogElement>(null);
  const nativePrompt = useRef<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState<Guide>("browser");

  useEffect(() => {
    const mode = matchMedia("(display-mode: standalone)");
    const sync = () => setInstalled(mode.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const complete = () => { setInstalled(true); nativePrompt.current = null; };
    const capture = (event: Event) => { event.preventDefault(); nativePrompt.current = event as InstallEvent; };
    sync();
    mode.addEventListener("change", sync);
    window.addEventListener("appinstalled", complete);
    window.addEventListener("beforeinstallprompt", capture);
    return () => {
      mode.removeEventListener("change", sync);
      window.removeEventListener("appinstalled", complete);
      window.removeEventListener("beforeinstallprompt", capture);
    };
  }, []);

  async function install() {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const event = nativePrompt.current;
    if (!ios && event) {
      nativePrompt.current = null;
      try {
        await event.prompt();
        if ((await event.userChoice).outcome === "accepted") setInstalled(true);
        return;
      } catch { /* Offer browser instructions if the saved invitation expired. */ }
    }
    setGuide(ios ? "ios" : /Version\/.*Safari\//.test(navigator.userAgent) ? "safari" : "browser");
    dialog.current?.showModal();
  }

  if (installed) return null;
  return <>
    <button type="button" className={styles.install} onClick={install}>
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M10 2v10m-4-4 4 4 4-4M3 12v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
      </svg>{pl ? "Zainstaluj" : "Install"}
    </button>
    <dialog className={styles.installGuide} ref={dialog} aria-labelledby="install-title">
      <img alt="" src="/library-app/icon-192.png" width="48" height="48" />
      <h2 id="install-title">{pl ? "Zainstaluj bibliotekę" : "Install App Library"}</h2>
      {guide === "ios" ? <ol>{pl ? <>
        <li>Otwórz tę stronę w Safari i stuknij <strong>Udostępnij</strong> na pasku narzędzi lub w menu strony.</li>
        <li>Przewiń listę i wybierz <strong>Do ekranu początkowego</strong>.</li>
        <li>Jeśli pojawi się opcja otwierania jako aplikacji, włącz ją. Stuknij <strong>Dodaj</strong>.</li>
      </> : <>
        <li>Open this page in Safari. Tap <strong>Share</strong> in the toolbar or page menu.</li>
        <li>Scroll down and choose <strong>Add to Home Screen</strong>.</li>
        <li>If offered, turn on <strong>Open as Web App</strong>. Tap <strong>Add</strong>.</li>
      </>}</ol> : <p>{guide === "safari"
        ? pl ? "W menu Plik w Safari wybierz opcję dodania strony do Docka." : "In Safari’s File menu, choose Add to Dock."
        : pl ? "W menu przeglądarki wybierz opcję instalacji aplikacji lub dodania jej do ekranu głównego. Jeśli jej nie widzisz, otwórz bibliotekę w Chrome lub Edge." : "Choose Install app or Add to Home screen in your browser menu. If that option is missing, open the library in Chrome or Edge."}</p>}
      <form method="dialog"><button>{pl ? "Zamknij" : "Close"}</button></form>
    </dialog>
  </>;
}
