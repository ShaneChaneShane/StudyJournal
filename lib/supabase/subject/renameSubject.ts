import { assertOk } from "@/lib/supabase/helper";
import { SubjectRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function renameSubject(
    supabase: SupabaseClient,
    subjectId: string,
    name: string
) {
    const res = await supabase
        .from("subjects")
        .update({ name })
        .eq("id", subjectId)
        .select("*")
        .single();

    return assertOk(res, "renameSubject failed") as SubjectRow;
}