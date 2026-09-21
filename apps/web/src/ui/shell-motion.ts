type Killable = { kill: () => void };

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export async function playShellIntro(
  target: HTMLElement | null,
): Promise<Killable | null> {
  if (!target) return null;
  const { default: gsap } = await import("gsap");
  if (prefersReducedMotion()) {
    gsap.set(target, { autoAlpha: 1, y: 0 });
    return null;
  }
  return gsap.fromTo(
    target,
    { autoAlpha: 0, y: 10 },
    { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" },
  );
}

/** Dashboard entrance: brand, form, then session cards. */
export async function playDashboardIntro(
  root: HTMLElement | null,
): Promise<Killable | null> {
  if (!root) return null;
  const { default: gsap } = await import("gsap");
  const header = root.querySelector<HTMLElement>("[data-motion='header']");
  const create = root.querySelector<HTMLElement>("[data-motion='create']");
  const recent = root.querySelectorAll<HTMLElement>("[data-motion='recent']");

  if (prefersReducedMotion()) {
    gsap.set([header, create, ...recent].filter(Boolean), { autoAlpha: 1, y: 0 });
    return null;
  }

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  if (header) {
    tl.fromTo(header, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0);
  }
  if (create) {
    tl.fromTo(create, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.12);
  }
  if (recent.length > 0) {
    tl.fromTo(
      recent,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.06 },
      0.22,
    );
  }
  return { kill: () => { tl.kill(); } };
}
