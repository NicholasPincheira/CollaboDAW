export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export function readSupabasePublicConfig(
  env: ImportMetaEnv | Record<string, string | undefined> = import.meta.env,
): SupabasePublicConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
