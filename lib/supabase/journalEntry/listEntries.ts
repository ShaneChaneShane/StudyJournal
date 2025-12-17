import { assertOk, uniq } from "@/lib/supabase/helper";
import type { EntryWithSubjectsRow, JournalEntryRow } from "@/supabase/types/journalEntry";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listEntries(
    supabase: SupabaseClient,
    input?: {
        order?: "asc" | "desc"; // order by entry_timestamp
        limit?: number;
        offset?: number;
    }
): Promise<EntryWithSubjectsRow[]> {
    const {
        order = "desc",
        limit = 200,
        offset = 0,
    } = input ?? {};

    const entriesRes = await supabase
        .from("journal_entries")
        .select("*")
        .order("entry_timestamp", { ascending: order === "asc" })
        .range(offset, offset + limit - 1);

    const entries = assertOk(entriesRes, "listEntries failed") as JournalEntryRow[];
    if (entries.length === 0) return [];

    const ids = entries.map((e) => e.id);

    const joinsRes = await supabase
        .from("entry_subjects")
        .select("entry_id, subject_id")
        .in("entry_id", ids);

    const joins = assertOk(joinsRes, "listEntries joins failed") as {
        entry_id: string;
        subject_id: string;
    }[];

    const map = new Map<string, string[]>();

    for (const j of joins) {
        const arr = map.get(j.entry_id) ?? [];
        arr.push(j.subject_id);
        map.set(j.entry_id, arr);
    }

    // 4. Merge result
    return entries.map((e) => ({
        ...e,
        subjectIds: uniq(map.get(e.id) ?? []),
    }));
}
