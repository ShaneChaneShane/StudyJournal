import { assertOk, clampProductivity } from "@/lib/supabase/helper";
import type { JournalEntryRow } from "@/supabase/types/journalEntry";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function updateEntry(
    supabase: SupabaseClient,
    entryId: string,
    patch: Partial<{
        entryTimestamp: Date;
        title: string | null;
        content: string;
        productivity: number;
        imagePath: string | null;
    }>
) {
    const payload: any = {};
    if (patch.entryTimestamp) payload.entry_timestamp = patch.entryTimestamp.toISOString();
    if ("title" in patch) payload.title = patch.title ?? null;
    if ("content" in patch) payload.content = patch.content;
    if ("productivity" in patch && typeof patch.productivity === "number")
        payload.productivity = clampProductivity(patch.productivity);
    if ("imagePath" in patch) payload.image_path = patch.imagePath ?? null;

    payload.updated_at = new Date().toISOString();

    const res = await supabase
        .from("journal_entries")
        .update(payload)
        .eq("id", entryId)
        .select("*")
        .single();

    return assertOk(res, "updateEntry failed") as JournalEntryRow;
}
