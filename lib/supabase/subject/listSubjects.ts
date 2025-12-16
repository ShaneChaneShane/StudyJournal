import { assertOk } from "@/lib/supabase/helper";
import { SubjectRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";


export async function listSubjects(supabase: SupabaseClient, opts?: { onlyActive?: boolean }
) {
    const query = supabase
        .from("subjects")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

    if (opts?.onlyActive) {
        query.eq("is_active", true);
    }
    const res = await query;
    return assertOk(res, "listSubjects failed") as SubjectRow[];
}
