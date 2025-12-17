import { assertOk, clampProductivity, uniq } from "@/lib/supabase/helper";
import type { EntryWithSubjectsRow, JournalEntryRow } from "@/supabase/types/journalEntry";
import type { SupabaseClient } from "@supabase/supabase-js";


export async function createEntry(
    supabase: SupabaseClient,
    input: {
        clerkUserId: string;
        entryTimestamp: Date; // user can pick past dates
        title?: string | null;
        content: string;
        productivity: number; // 1..5
        subjectIds: string[];
        imagePath?: string | null; // optional, after upload
    }
): Promise<EntryWithSubjectsRow> {
    const productivity = clampProductivity(input.productivity);
    const subjectIds = uniq(input.subjectIds).filter(Boolean);

    const inserted = await supabase
        .from("journal_entries")
        .insert({
            user_id: input.clerkUserId,
            entry_timestamp: input.entryTimestamp.toISOString(),
            title: input.title ?? null,
            content: input.content,
            productivity,
            image_path: input.imagePath ?? null,
        })
        .select("*")
        .single();

    const entry = assertOk(inserted, "createEntry insert failed") as JournalEntryRow;

    if (subjectIds.length > 0) {
        const joinRows = subjectIds.map((sid) => ({
            entry_id: entry.id,
            subject_id: sid,
        }));
        const joinRes = await supabase
            .from("entry_subjects")
            .insert(joinRows)
            .select("entry_id, subject_id");
        assertOk(joinRes as any, "createEntry entry_subjects insert failed");
    }

    return { ...entry, subjectIds };
}
