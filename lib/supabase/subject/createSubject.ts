import { assertOk } from "@/lib/supabase/helper";
import { SubjectRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function createSubject(
    supabase: SupabaseClient,
    clerkUserId: string,
    name: string,
    color: string,
    sortOrder?: number,
) {
    const res = await supabase
        .from("subjects")
        .insert({
            user_id: clerkUserId,
            name,
            color,
            is_active: true,
            sort_order: sortOrder ?? null,
        })
        .select("*")
        .single();

    return assertOk(res, "createSubject failed") as SubjectRow;
}
