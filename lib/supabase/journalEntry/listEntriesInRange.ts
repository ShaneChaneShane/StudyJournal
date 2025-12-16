import { assertOk, uniq } from "@/lib/supabase/helper";
import type { EntryWithSubjectsRow, JournalEntryRow } from "@/supabase/types/journalEntry";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function listEntriesInRange(
    supabase: SupabaseClient,
    input: {
        from: Date; // inclusive
        to: Date; // exclusive
        limit?: number;
        offset?: number;
    }
): Promise<EntryWithSubjectsRow[]> {
    const { from, to, limit = 200, offset = 0 } = input;

    const entriesRes = await supabase
        .from("journal_entries")
        .select("*")
        .gte("entry_timestamp", from.toISOString())
        .lt("entry_timestamp", to.toISOString())
        .order("entry_timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

    const entries = assertOk(entriesRes, "listEntriesInRange failed") as JournalEntryRow[];
    if (entries.length === 0) return [];

    const ids = entries.map((e) => e.id);
    const joinsRes = await supabase
        .from("entry_subjects")
        .select("entry_id, subject_id")
        .in("entry_id", ids);

    const joins = assertOk(joinsRes as any, "listEntriesInRange joins failed") as {
        entry_id: string;
        subject_id: string;
    }[];

    const map = new Map<string, string[]>();
    for (const j of joins) {
        const arr = map.get(j.entry_id) ?? [];
        arr.push(j.subject_id);
        map.set(j.entry_id, arr);
    }

    return entries.map((e) => ({
        ...e,
        subjectIds: uniq(map.get(e.id) ?? []),
    }));
}
