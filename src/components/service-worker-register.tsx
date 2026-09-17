"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // L'enregistrement peut échouer en développement local (HTTP) —
        // sans conséquence, le site fonctionne normalement sans PWA.
      });
    }
  }, []);

  return null;
}
