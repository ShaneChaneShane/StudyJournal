import { CalendarDaySummary } from "@/lib/model/journalEntry";
import type { StreakInfo } from "@/lib/model/streak";
import type { SubjectAverage } from "@/lib/model/subject";
import { dayKeyLocal } from "@/lib/supabase/helper";
import { JournalEntryMetaWithSubjects } from "../journalEntry/listEntryMetaInRange";
function isInRange(ts: string, from: Date, to: Date) {
    const d = new Date(ts);
    return d >= from && d < to;
}

export function computeWeekSummaries(
    entries: JournalEntryMetaWithSubjects[],
    from: Date,
    to: Date
): CalendarDaySummary[] {
    // group by local YYYY-MM-DD
    const agg = new Map<string, { count: number; sum: number }>();

    for (const e of entries) {
        if (!isInRange(e.entry_timestamp, from, to)) continue;

        const k = dayKeyLocal(new Date(e.entry_timestamp));
        const cur = agg.get(k) ?? { count: 0, sum: 0 };
        cur.count += 1;
        cur.sum += e.productivity;
        agg.set(k, cur);
    }

    // build output for each day in the week range (even if 0 entries)
    const out: CalendarDaySummary[] = [];
    for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
        const k = dayKeyLocal(d);
        const a = agg.get(k) ?? { count: 0, sum: 0 };
        out.push({
            dateKey: k,
            entryCount: a.count,
            avgProductivity: a.count ? a.sum / a.count : 0,
        });
    }

    return out;
}

export function computeMonthlyAverages(
    entries: JournalEntryMetaWithSubjects[],
    from: Date,
    to: Date,
    activeSubjectIds: string[]
): SubjectAverage[] {
    const active = new Set(activeSubjectIds);

    const sum = new Map<string, number>();
    const cnt = new Map<string, number>();

    for (const e of entries) {
        if (!isInRange(e.entry_timestamp, from, to)) continue;

        for (const sid of e.subjectIds) {
            if (!active.has(sid)) continue;
            sum.set(sid, (sum.get(sid) ?? 0) + e.productivity);
            cnt.set(sid, (cnt.get(sid) ?? 0) + 1);
        }
    }

    const out: SubjectAverage[] = [];
    for (const [subjectId, productivity_total] of sum.entries()) {
        const count = cnt.get(subjectId) ?? 0;
        out.push({
            subjectId,
            count,
            avg: count ? productivity_total / count : 0,
        });
    }

    // optional: most-used subjects first
    out.sort((a, b) => b.count - a.count);
    return out;
}

export function computeStreakInfo(
    entries: JournalEntryMetaWithSubjects[],
    now: Date
): StreakInfo {
    const daySet = new Set<string>();
    for (const e of entries) {
        daySet.add(dayKeyLocal(new Date(e.entry_timestamp)));
    }

    // if today has entry, streak anchors at today
    // if today has no entry, streak anchors at yesterday
    const todayKey = dayKeyLocal(now);
    const anchor = new Date(now);
    if (!daySet.has(todayKey)) anchor.setDate(anchor.getDate() - 1);

    let current = 0;
    for (let i = 0; ; i++) {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - i);
        const k = dayKeyLocal(d);
        if (daySet.has(k)) current += 1;
        else break;
    }

    // longest streak
    const days = Array.from(daySet.values()).sort(); // YYYY-MM-DD sorts correctly
    let longest = 0;
    let run = 0;

    for (let i = 0; i < days.length; i++) {
        if (i === 0) {
            run = 1;
        } else {
            const prev = new Date(days[i - 1] + "T00:00:00");
            const cur = new Date(days[i] + "T00:00:00");
            const diffDays = Math.round((cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) run += 1;
            else run = 1;
        }
        if (run > longest) longest = run;
    }

    return { currentStreak: current, longestStreak: longest };
}
