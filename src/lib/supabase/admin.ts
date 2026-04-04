import { createClient } from '@supabase/supabase-js';

// Admin client — bypasses RLS using service role key.
// ONLY use server-side for operations that need elevated access:
// - Writing encrypted secrets
// - Incrementing clone counts
// - Cross-tenant admin operations
let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (!adminClient) {
    adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return adminClient;
}
