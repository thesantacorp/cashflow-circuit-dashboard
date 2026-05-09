import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  // @ts-expect-error iOS Safari
  window.navigator.standalone === true;

export default function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (!isMobile() || isStandalone()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS has no beforeinstallprompt — show manual instructions
    if (isIOS()) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }

    // Fallback for Android browsers that delay the event — show after a short wait
    const fallback = setTimeout(() => {
      if (!isStandalone()) setOpen(true);
    }, 1500);

    return () => {
      clearTimeout(fallback);
      window.removeEventListener("beforeinstallprompt", onBIP);
    };
  }, []);

  const handleInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setOpen(false);
    }
  };

  if (!isMobile() || isStandalone()) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Install Stackd
          </DialogTitle>
          <DialogDescription>
            Install Stackd on your phone for the best experience — fast access from your home screen.
          </DialogDescription>
        </DialogHeader>

        {isIOS() ? (
          <div className="space-y-3 text-sm">
            <p>To install on iPhone/iPad:</p>
            <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
              <li className="flex items-center gap-2">
                <span>Tap the</span> <Share className="h-4 w-4 inline" /> <span>Share button in Safari</span>
              </li>
              <li className="flex items-center gap-2">
                <span>Choose</span> <Plus className="h-4 w-4 inline" /> <span>"Add to Home Screen"</span>
              </li>
              <li>Tap "Add" to finish</li>
            </ol>
          </div>
        ) : deferred ? (
          <p className="text-sm text-muted-foreground">
            Tap Install to add Stackd to your home screen.
          </p>
        ) : (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Open this site in Chrome, then:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Tap the menu (⋮)</li>
              <li>Choose "Install app" or "Add to Home screen"</li>
            </ol>
          </div>
        )}

        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            <X className="h-4 w-4 mr-1" /> Not now
          </Button>
          {deferred && (
            <Button onClick={handleInstall}>
              <Download className="h-4 w-4 mr-1" /> Install
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
