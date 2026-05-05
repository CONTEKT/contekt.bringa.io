export const localDemoUser = null;

export function createLocalDemoSupabaseClient(): never {
  throw new Error("Development Supabase fixture client is not available in production builds.");
}
