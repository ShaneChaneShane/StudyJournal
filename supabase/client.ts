import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Put these in app config (Expo):
 * EXPO_PUBLIC_SUPABASE_URL
 * EXPO_PUBLIC_SUPABASE_ANON_KEY
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Fail early to notice misconfig
    throw new Error(
        "Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY"
    );
}

/**
 * Clerk + Supabase:
 * - Create a Supabase client that attaches the Clerk JWT to every request.
 */
export function getSupabaseWithClerk(
    getToken: (opts?: { template?: string }) => Promise<string | null>
): SupabaseClient {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
        global: {
            fetch: async (url, options = {}) => {
                // make a JWT template named "supabase" in clerk Dashboard
                const token = await getToken({ template: "supabase" });

                const headers = new Headers(options.headers);
                if (token) headers.set("Authorization", `Bearer ${token}`);

                return fetch(url, { ...options, headers });
            },
        },
    });
}

export function getSupabaseWithClerkJWT(clerkJwt: string) {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${clerkJwt}`,
            },
        },
    });
}