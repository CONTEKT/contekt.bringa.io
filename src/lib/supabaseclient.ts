import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { appConfig } from "@/lib/app-config"
import { createLocalDemoSupabaseClient } from "@/lib/local-demo-supabase"
import { isLocalDemoModeEnabled } from "@/lib/local-demo-mode"

const supabaseUrl = appConfig.supabase.url
const supabasePublishableKey = appConfig.supabase.publishableKey
export const localDemoModeEnabled = isLocalDemoModeEnabled({ config: appConfig })

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase public configuration. Set supabase.url and supabase.publishableKey in deployment config.");
}

export const supabase: SupabaseClient = localDemoModeEnabled
  ? (createLocalDemoSupabaseClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabasePublishableKey)
