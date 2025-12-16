import { assertOk } from "@/lib/supabase/helper";
import type { EntryWithSubjects, JournalEntryRow } from "@/supabase/types/journalEntry";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getEntryById(
    supabase: SupabaseClient,
    entryId: string
): Promise<EntryWithSubjects | null> {
    const entryRes = await supabase
        .from("journal_entries")
        .select("*")
        .eq("id", entryId)
        .maybeSingle();

    if (entryRes.error) throw new Error(`getEntryById failed: ${entryRes.error.message}`);
    if (!entryRes.data) return null;

    const joins = await supabase
        .from("entry_subjects")
        .select("subject_id")
        .eq("entry_id", entryId);

    const joinRows = assertOk(joins as any, "getEntryById subject join failed") as {
        subject_id: string;
    }[];

    return {
        ...(entryRes.data as JournalEntryRow),
        subjectIds: joinRows.map((r) => r.subject_id),
    };
}