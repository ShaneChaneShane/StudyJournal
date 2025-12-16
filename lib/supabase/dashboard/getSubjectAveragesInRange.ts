
import { listEntriesInRange } from "@/lib/supabase/journalEntry/listEntriesInRange";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";
import { SubjectAverageRow } from "@/supabase/types/subject";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSubjectAveragesInRange(
    supabase: SupabaseClient,
    input: {
        from: Date;
        to: Date;
        includeInactiveSubjects?: boolean; // default false
    }
): Promise<SubjectAverageRow[]> {
    const entries = await listEntriesInRange(supabase, {
        from: input.from,
        to: input.to,
        limit: 2000,
        offset: 0,
    });

    // If inactive subjects excluded from dashboard:
    let activeSet: Set<string> | null = null;
    if (!input.includeInactiveSubjects) {
        const subjects = await listSubjects(supabase);
        activeSet = new Set(subjects.filter((s) => s.is_active).map((s) => s.id));
    }

    const sum = new Map<string, number>();
    const cnt = new Map<string, number>();

    for (const e of entries) {
        for (const sid of e.subjectIds) {
            if (activeSet && !activeSet.has(sid)) continue;
            sum.set(sid, (sum.get(sid) ?? 0) + e.productivity);
            cnt.set(sid, (cnt.get(sid) ?? 0) + 1);
        }
    }

    const out: SubjectAverageRow[] = [];
    for (const [subjectId, productivity_total] of sum.entries()) {
        const count = cnt.get(subjectId) ?? 0;
        out.push({ subjectId, count, avg: count ? productivity_total / count : 0 });
    }

    // sort by count desc
    out.sort((a, b) => b.count - a.count);
    return out;
}