import type { ControlPlaneProbe } from "../../domain/session/control-plane-probe.ts";
import type { SessionCatalog } from "../../domain/session/session-catalog.ts";
import type { SessionPresence } from "../../domain/session/session-presence.ts";
import { createSupabaseClient } from "../supabase/create-supabase-client.ts";
import { readSupabasePublicConfig } from "../supabase/supabase-config.ts";
import { LocalControlPlaneProbe } from "./local-control-plane-probe.ts";
import { LocalSessionCatalog } from "./local-session-catalog.ts";
import { LocalSessionPresence } from "./local-session-presence.ts";
import { SupabaseControlPlaneProbe } from "./supabase-control-plane-probe.ts";
import { SupabaseSessionCatalog } from "./supabase-session-catalog.ts";
import { SupabaseSessionPresence } from "./supabase-session-presence.ts";

export type SessionBackend = "supabase" | "local";

export function createSessionCatalog(): {
  catalog: SessionCatalog;
  backend: SessionBackend;
  createPresence: () => SessionPresence;
  createControlPlaneProbe: () => ControlPlaneProbe;
} {
  const config = readSupabasePublicConfig();
  if (config) {
    const client = createSupabaseClient(config);
    return {
      catalog: new SupabaseSessionCatalog(client),
      backend: "supabase",
      createPresence: () => new SupabaseSessionPresence(client),
      createControlPlaneProbe: () => new SupabaseControlPlaneProbe(client),
    };
  }
  return {
    catalog: new LocalSessionCatalog(),
    backend: "local",
    createPresence: () => new LocalSessionPresence(),
    createControlPlaneProbe: () => new LocalControlPlaneProbe(),
  };
}
