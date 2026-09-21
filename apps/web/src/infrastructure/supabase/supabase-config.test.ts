import { describe, expect, it } from "vitest";
import { readSupabasePublicConfig } from "./supabase-config.ts";

describe("readSupabasePublicConfig", () => {
  it("returns null without inventing credentials", () => {
    expect(readSupabasePublicConfig({})).toBeNull();
    expect(readSupabasePublicConfig({ VITE_SUPABASE_URL: "https://x.supabase.co" })).toBeNull();
  });

  it("reads only public env values", () => {
    expect(
      readSupabasePublicConfig({
        VITE_SUPABASE_URL: " https://x.supabase.co ",
        VITE_SUPABASE_ANON_KEY: " anon ",
      }),
    ).toEqual({
      url: "https://x.supabase.co",
      anonKey: "anon",
    });
  });
});
