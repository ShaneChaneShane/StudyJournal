import { CalendarDaySummary } from "@/lib/model/journalEntry";
import { dayKeyLocal } from "@/lib/supabase/helper";
import { listEntriesInRange } from "@/lib/supabase/journalEntry/listEntriesInRange";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Return: dayKey -> avg productivity that day, and hasEntry.
 * Optional subject filter
 */

export async function getCalendarDaySummaries(
    supabase: SupabaseClient,
    input: {
        from: Date;
        to: Date;
        subjectFilterIds?: string[]; // optional filter by subjects
    }
): Promise<CalendarDaySummary[]> {
    const entries = await listEntriesInRange(supabase, {
        from: input.from,
        to: input.to,
        limit: 5000,
    });

    const filter = input.subjectFilterIds?.length
        ? new Set(input.subjectFilterIds)
        : null;

    const sum = new Map<string, number>();
    const cnt = new Map<string, number>();

    for (const e of entries) {
        if (filter) {
            // keep entry only if it has at least one of the filtered subjects
            const ok = e.subjectIds.some((sid) => filter.has(sid));
            if (!ok) continue;
        }

        const key = dayKeyLocal(new Date(e.entry_timestamp));
        sum.set(key, (sum.get(key) ?? 0) + e.productivity);
        cnt.set(key, (cnt.get(key) ?? 0) + 1);
    }

    const out: CalendarDaySummary[] = [];
    for (const [dateKey, productivity_total] of sum.entries()) {
        const entryCount = cnt.get(dateKey) ?? 0;
        out.push({
            dateKey,
            entryCount,
            avgProductivity: entryCount ? productivity_total / entryCount : 0,
        });
    }

    out.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
    return out;
}
