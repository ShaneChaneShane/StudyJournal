import { assertOk } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteEntry(
    supabase: SupabaseClient,
    entryId: string
) {
    // delete joins first to avoid constraint errors.
    const delJoins = await supabase.from("entry_subjects").delete().eq("entry_id", entryId);
    assertOk(delJoins as any, "deleteEntry join delete failed");

    const delEntry = await supabase.from("journal_entries").delete().eq("id", entryId);
    assertOk(delEntry as any, "deleteEntry failed");
}