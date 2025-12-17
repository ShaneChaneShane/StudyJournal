import { assertOk, uniq } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function setEntrySubjects(
    supabase: SupabaseClient,
    entryId: string,
    subjectIds: string[]
) {
    const unique = uniq(subjectIds).filter(Boolean);

    // simplest: delete old, insert new
    const del = await supabase.from("entry_subjects").delete().eq("entry_id", entryId);
    if (del.error) throw new Error("setEntrySubjects delete failed");
    console.log(del)
    if (unique.length === 0) return;

    const ins = await supabase
        .from("entry_subjects")
        .insert(unique.map((sid) => ({ entry_id: entryId, subject_id: sid })))
        .select("entry_id, subject_id");

    assertOk(ins as any, "setEntrySubjects insert failed");
}