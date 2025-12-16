import { DEFAULT_SUBJECTS } from "@/lib/constants/subjects";
import { assertOk } from "@/lib/supabase/helper";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";
import { SubjectRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * - On first app launch (or first dashboard load), call ensureDefaultSubjects()
 * - It will create the 5 subjects if user has none yet.
 */
export async function ensureDefaultSubjects(
    supabase: SupabaseClient,
    clerkUserId: string
) {
    const existing = await listSubjects(supabase);
    if (existing.length > 0) return existing;

    const rows = DEFAULT_SUBJECTS.map((subject, i) => ({
        user_id: clerkUserId,
        subject,
        is_active: true,
        sort_order: i + 1,
    }));

    const inserted = await supabase.from("subjects").insert(rows).select("*");
    return assertOk(inserted, "ensureDefaultSubjects insert failed") as SubjectRow[];
}