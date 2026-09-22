import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import gsap from "gsap";

export type StudioStripSection = {
  id: string;
  label: string;
  hint?: string;
  content: ReactNode;
};

const DRAG_THRESHOLD_PX = 8;
const HOLD_MS = 140;

/**
 * Horizontal tool strip: quick press = select section; hold / move = pan.
 * Uses GSAP for transform + snap; never for audio timing.
 */
export function StudioDragStrip({
  sections,
  activeId,
  onSelect,
}: {
  sections: StudioStripSection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const dragRef = useRef<{
    mode: "idle" | "pending" | "dragging";
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    holdTimer: number | null;
    moved: boolean;
    targetId: string | null;
  }>({
    mode: "idle",
    pointerId: -1,
    startX: 0,
    startY: 0,
    originX: 0,
    holdTimer: null,
    moved: false,
    targetId: null,
  });

  const clampX = (x: number) => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return 0;
    const max = Math.min(0, viewport.clientWidth - track.scrollWidth);
    return gsap.utils.clamp(max, 0, x);
  };

  const applyX = (x: number, animate: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    const next = clampX(x);
    xRef.current = next;
    if (animate) {
      gsap.to(track, { x: next, duration: 0.35, ease: "power3.out", overwrite: true });
    } else {
      gsap.set(track, { x: next });
    }
  };

  const clearHold = () => {
    const state = dragRef.current;
    if (state.holdTimer != null) {
      window.clearTimeout(state.holdTimer);
      state.holdTimer = null;
    }
  };

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest("button, a, input, select, textarea, label, [data-strip-no-drag]"),
    );
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    const card = (event.target as Element).closest<HTMLElement>("[data-strip-id]");
    const state = dragRef.current;
    clearHold();
    state.mode = "pending";
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.originX = xRef.current;
    state.moved = false;
    state.targetId = card?.dataset.stripId ?? null;
    state.holdTimer = window.setTimeout(() => {
      if (state.mode === "pending") {
        state.mode = "dragging";
        viewportRef.current?.setPointerCapture(event.pointerId);
      }
    }, HOLD_MS);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (state.mode === "idle" || state.pointerId !== event.pointerId) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    if (state.mode === "pending") {
      if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        clearHold();
        state.mode = "dragging";
        state.moved = true;
        viewportRef.current?.setPointerCapture(event.pointerId);
      } else {
        return;
      }
    }

    if (state.mode === "dragging") {
      state.moved = true;
      applyX(state.originX + dx, false);
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (state.pointerId !== event.pointerId) return;
    clearHold();

    const wasPending = state.mode === "pending";
    const wasDragging = state.mode === "dragging";
    const targetId = state.targetId;
    state.mode = "idle";
    state.pointerId = -1;

    if (wasDragging) {
      applyX(xRef.current, true);
      return;
    }

    if (wasPending && !state.moved && targetId) {
      onSelect(targetId);
      const card = trackRef.current?.querySelector<HTMLElement>(`[data-strip-id="${targetId}"]`);
      const viewport = viewportRef.current;
      if (card && viewport) {
        const cardLeft = card.offsetLeft;
        const center = cardLeft - (viewport.clientWidth - card.offsetWidth) / 2;
        applyX(-center, true);
      }
    }
  };

  useEffect(() => {
    applyX(xRef.current, false);
    const onResize = () => applyX(xRef.current, false);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearHold();
    };
  }, []);

  useEffect(() => {
    const card = trackRef.current?.querySelector<HTMLElement>(`[data-strip-id="${activeId}"]`);
    const viewport = viewportRef.current;
    if (!card || !viewport) return;
    const center = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
    applyX(-center, true);
  }, [activeId]);

  return (
    <div
      ref={viewportRef}
      className="relative touch-pan-y overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div ref={trackRef} className="flex w-max gap-2 will-change-transform px-0.5 pb-1">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <article
              key={section.id}
              data-strip-id={section.id}
              className={`flex w-[min(18.5rem,78vw)] shrink-0 flex-col rounded-xl border bg-studio-elevated/70 p-2.5 sm:w-[20rem] ${
                active
                  ? "border-studio-accent/45 shadow-[0_0_0_1px_rgba(34,211,238,0.12)]"
                  : "border-white/8"
              }`}
            >
              <header className="mb-2 flex cursor-grab items-baseline justify-between gap-2 active:cursor-grabbing">
                <h3 className="text-[10px] font-semibold tracking-[0.14em] text-studio-accent uppercase">
                  {section.label}
                </h3>
                {section.hint ? (
                  <span className="truncate text-[10px] text-studio-dim">{section.hint}</span>
                ) : null}
              </header>
              <div className="min-h-0 flex-1 space-y-2 text-xs">{section.content}</div>
            </article>
          );
        })}
      </div>
      <p className="mt-1 text-[10px] text-studio-dim">
        Click a card to focus · hold / drag to scroll
      </p>
    </div>
  );
}
