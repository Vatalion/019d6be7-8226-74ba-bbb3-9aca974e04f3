import { useEffect, useRef, useState } from "react";

/**
 * Returns isVisible (true when document.visibilityState === 'visible').
 * Also returns a flag justBecameVisible that is true for one render cycle
 * after the tab becomes visible following > 30s of being hidden.
 */
export function useVisiblePolling() {
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );
  const hiddenAtRef = useRef<number | null>(null);
  const [justBecameVisible, setJustBecameVisible] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);
      if (!visible) {
        hiddenAtRef.current = Date.now();
        setJustBecameVisible(false);
      } else {
        const hiddenDuration = hiddenAtRef.current
          ? Date.now() - hiddenAtRef.current
          : 0;
        if (hiddenDuration > 30_000) {
          setJustBecameVisible(true);
          // reset after one render
          setTimeout(() => setJustBecameVisible(false), 100);
        }
        hiddenAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return { isVisible, justBecameVisible };
}
