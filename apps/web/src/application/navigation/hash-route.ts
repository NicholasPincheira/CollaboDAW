export type AppRoute =
  | { name: "dashboard" }
  | { name: "studio"; sessionId: string };

export function parseHashRoute(hash: string): AppRoute {
  const raw = hash.replace(/^#/, "") || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const match = path.match(/^\/session\/([^/?#]+)/);
  if (match?.[1]) {
    return { name: "studio", sessionId: decodeURIComponent(match[1]) };
  }
  return { name: "dashboard" };
}

export function routeToHash(route: AppRoute): string {
  if (route.name === "studio") {
    return `#/session/${encodeURIComponent(route.sessionId)}`;
  }
  return "#/";
}
