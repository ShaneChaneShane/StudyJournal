import { assertOk, uniq } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export type JournalEntryMetaRow = {
    id: string;
    entry_timestamp: string; // timestamptz string
    productivity: number; // 1..5
};

export type JournalEntryMetaWithSubjects = JournalEntryMetaRow & {
    subjectIds: string[];
};

export async function listEntryMetaInRange(
    supabase: SupabaseClient,
    input: {
        from: Date; // inclusive
        to: Date; // exclusive
        includeSubjectIds?: boolean; // default true
        limit?: number;
        offset?: number;
    }
): Promise<JournalEntryMetaWithSubjects[]> {
    const {
        from,
        to,
        includeSubjectIds = true,
        limit = 5000,
        offset = 0,
    } = input;

    const entriesRes = await supabase
        .from("journal_entries")
        .select("id, entry_timestamp, productivity")
        .gte("entry_timestamp", from.toISOString())
        .lt("entry_timestamp", to.toISOString())
        .order("entry_timestamp", { ascending: false })
        .range(offset, offset + limit - 1);

    const entries = assertOk(entriesRes as any, "listEntryMetaInRange failed") as JournalEntryMetaRow[];
    if (entries.length === 0) return [];

    if (!includeSubjectIds) {
        return entries.map((e) => ({ ...e, subjectIds: [] }));
    }

    const ids = entries.map((e) => e.id);

    const joinsRes = await supabase
        .from("entry_subjects")
        .select("entry_id, subject_id")
        .in("entry_id", ids);

    const joins = assertOk(joinsRes as any, "listEntryMetaInRange joins failed") as {
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
