export async function playShellIntro(
  target: HTMLElement | null,
): Promise<{ kill: () => void } | null> {
  if (!target) return null;
  const { default: gsap } = await import("gsap");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(target, { autoAlpha: 1, y: 0 });
    return null;
  }
  return gsap.fromTo(
    target,
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
  );
}
