import type { SessionCatalog } from "../../domain/session/session-catalog.ts";
import { createSupabaseClient } from "../supabase/create-supabase-client.ts";
import { readSupabasePublicConfig } from "../supabase/supabase-config.ts";
import { LocalSessionCatalog } from "./local-session-catalog.ts";
import { SupabaseSessionCatalog } from "./supabase-session-catalog.ts";

export type SessionBackend = "supabase" | "local";

export function createSessionCatalog(): { catalog: SessionCatalog; backend: SessionBackend } {
  const config = readSupabasePublicConfig();
  if (config) {
    return {
      catalog: new SupabaseSessionCatalog(createSupabaseClient(config)),
      backend: "supabase",
    };
  }
  return {
    catalog: new LocalSessionCatalog(),
    backend: "local",
  };
}
