"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount. Rendered once from the root layout.
 *
 * Production only: a service worker intercepting requests alongside Next's
 * dev server (Turbopack HMR, on-demand compilation) causes stale/conflicting
 * script loads — symptoms include unresponsive inputs, janky scrolling, and
 * pages that never finish "loading". It also actively unregisters any
 * service worker left over from a previous production build so dev mode
 * stays clean.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    } else {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) registration.unregister();
      });
    }
  }, []);

  return null;
}
