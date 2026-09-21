import { useEffect, useSyncExternalStore } from "react";
import type { AudioLabController, AudioLabSnapshot } from "../application/audio-lab/audio-lab-controller.ts";

export function useAudioLab(controller: AudioLabController): AudioLabSnapshot {
  const snapshot = useSyncExternalStore(
    (listener) => controller.subscribe(listener),
    () => controller.getSnapshot(),
    () => controller.getSnapshot(),
  );

  useEffect(() => {
    void controller.initialize();
  }, [controller]);

  useEffect(() => {
    const onPageHide = (): void => {
      controller.dispose();
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [controller]);

  useEffect(() => {
    if (snapshot.status !== "running") return;
    let frame = 0;
    const tick = (): void => {
      controller.pollMeters();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [controller, snapshot.status]);

  return snapshot;
}
