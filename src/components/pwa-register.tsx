"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ButtonLoader } from "@/components/ui/button-loader";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function PwaRegister() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [installBusy, setInstallBusy] = useState(false);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setIsInstalled(standalone);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = (event: MediaQueryListEvent) => setIsInstalled(event.matches);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    standaloneQuery.addEventListener("change", onDisplayModeChange);

    const supported = process.env.NODE_ENV === "production" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported && Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY));
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").then(async (registration) => {
        if (registration.waiting) setUpdateReady(true);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(true);
          });
        });
        if (supported) setPushEnabled(Boolean(await registration.pushManager.getSubscription()));
      }).catch((error) => console.error("EventSphere service worker registration failed:", error));
    }
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      standaloneQuery.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  async function installApp() {
    if (!installPrompt || installBusy) return;
    setInstallBusy(true);
    setInstallMessage("");
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
    } catch (error) {
      setInstallMessage(error instanceof Error ? error.message : "Unable to open the install prompt.");
    } finally {
      setInstallPrompt(null);
      setInstallBusy(false);
    }
  }

  async function togglePush() {
    if (!pushSupported || pushBusy) return;
    setPushBusy(true);
    setPushMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing && pushEnabled) {
        const response = await fetch("/api/push/subscribe", {
          method: "DELETE", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint })
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Unable to update notification settings.");
        }
        await existing.unsubscribe();
        setPushEnabled(false);
        setPushMessage("EventSphere notifications are turned off.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Allow notifications in your browser settings to continue.");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push notifications are not configured yet.");
      const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to save your notification preference. Sign in and try again.");
      }
      setPushEnabled(true);
      setPushMessage("Notifications enabled on this device.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Unable to update notifications.");
    } finally {
      setPushBusy(false);
    }
  }

  function refreshApp() {
    navigator.serviceWorker?.getRegistration().then((registration) => {
      registration?.waiting?.postMessage("SKIP_WAITING");
      window.location.reload();
    });
  }

  return (
    <>
      {isOffline && <div role="status" className="fixed inset-x-0 top-0 z-[100] bg-[#2b2438] px-4 py-2 text-center text-xs font-semibold text-white">You&apos;re offline. Some EventSphere features may be unavailable.</div>}
      {pushSupported && (
        <div className="fixed bottom-5 left-5 z-[90] flex max-w-[calc(100vw-2.5rem)] flex-col items-start gap-2">
          <button onClick={togglePush} disabled={pushBusy} className="flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-4 py-3 text-sm font-bold text-[#6d35e8] shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60">
            {pushBusy && <ButtonLoader/>}{pushBusy ? "Please wait…" : pushEnabled ? "Turn off notifications" : "Enable notifications"}
          </button>
          {pushMessage && <p role="status" className="max-w-xs rounded-xl bg-white px-3 py-2 text-xs text-[#514b60] shadow-lg">{pushMessage}</p>}
        </div>
      )}
      {installPrompt && !isInstalled && <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">{installMessage && <p role="alert" className="max-w-xs rounded-xl bg-white px-3 py-2 text-xs text-red-700 shadow-lg">{installMessage}</p>}<button onClick={installApp} disabled={installBusy} className="flex min-h-14 min-w-56 items-center justify-center gap-3 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-[#171329] shadow-xl shadow-violet-300 transition hover:-translate-y-0.5 disabled:opacity-60"><Image src="/eventsphere-logo.svg" alt="" aria-hidden="true" width={160} height={56} className="h-auto w-28" />{installBusy && <ButtonLoader className="text-[#6D35E8]" />}{installBusy ? "Opening install..." : "Install app"}</button></div>}
      {isInstalled && <div role="status" className="fixed bottom-5 right-5 z-[90] rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-xl shadow-violet-200/60"><Image src="/eventsphere-logo.svg" alt="EventSphere installed" width={200} height={70} className="h-auto w-36" /><span className="sr-only">EventSphere is installed.</span></div>}
      {updateReady && (
        <div className="fixed bottom-5 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#241b35] px-4 py-3 text-sm text-white shadow-xl">
          <span>A new version is ready.</span><button onClick={refreshApp} className="font-bold text-[#d9f66f]">Refresh</button>
        </div>
      )}
    </>
  );
}
