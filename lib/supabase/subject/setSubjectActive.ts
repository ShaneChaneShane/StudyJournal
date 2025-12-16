import { assertOk } from "@/lib/supabase/helper";
import { SubjectRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function setSubjectActive(
    supabase: SupabaseClient,
    subjectId: string,
    isActive: boolean
) {
    const res = await supabase
        .from("subjects")
        .update({ is_active: isActive })
        .eq("id", subjectId)
        .select("*")
        .single();

    return assertOk(res, "setSubjectActive failed") as SubjectRow;
}