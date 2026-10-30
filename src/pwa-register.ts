// Guarded service worker registration. Single registration point for the whole app.
// Refuses to register in dev, in Lovable preview/iframe, or when ?sw=off is set.

const APP_SW_PATH = "/sw.js";

function isPreviewHost(host: string): boolean {
  return (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  );
}

function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function unregisterAppSw() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.map(async (r) => {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(APP_SW_PATH)) {
        try {
          await r.unregister();
        } catch {
          /* noop */
        }
      }
    }),
  );
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const url = new URL(window.location.href);
  const killSwitch = url.searchParams.get("sw") === "off";
  const host = window.location.hostname;

  const refuse =
    !import.meta.env.PROD ||
    isInIframe() ||
    isPreviewHost(host) ||
    killSwitch;

  if (refuse) {
    // Make sure nothing sticks around from a previous registration
    unregisterAppSw().catch(() => {});
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(APP_SW_PATH).catch(() => {});
  });
}
