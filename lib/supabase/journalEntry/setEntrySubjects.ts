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
    assertOk(del as any, "setEntrySubjects delete failed");

    if (unique.length === 0) return;

    const ins = await supabase
        .from("entry_subjects")
        .insert(unique.map((sid) => ({ entry_id: entryId, subject_id: sid })));

    assertOk(ins as any, "setEntrySubjects insert failed");
}