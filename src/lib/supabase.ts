import { createBrowserClient as createSupabaseBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Helper for client-side components (runs in browser)
export function createClientClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Helper for server-side code (runs in Server Components, Actions, Route Handlers)
// Note: In Next.js 15+, cookies() is an async function and must be awaited.
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware is handling session refresh.
          }
        },
      },
    }
  );
}