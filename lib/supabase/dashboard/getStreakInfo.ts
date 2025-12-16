import { StreakInfo } from "@/lib/model/streak";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dayKeyLocal } from "../helper";
import { listEntriesInRange } from "../journalEntry/listEntriesInRange";

/**
 * "current streak" (consecutive days up to today)
 * "longest streak" overall
 * TODO: improve some logic
 */

export async function getStreakInfo(
    supabase: SupabaseClient,
    input?: { lookbackDays?: number }
): Promise<StreakInfo> {
    const lookbackDays = input?.lookbackDays ?? 365;

    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - lookbackDays);

    const entries = await listEntriesInRange(supabase, { from, to, limit: 5000 });

    const daySet = new Set<string>();
    for (const e of entries) {
        const d = new Date(e.entry_timestamp);
        daySet.add(dayKeyLocal(d));
    }

    const allDays = Array.from(daySet).sort(); // YYYY-MM-DD sorts fine
    if (allDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // longest streak
    let longest = 1;
    let run = 1;

    const toDate = (k: string) => {
        const [y, m, d] = k.split("-").map(Number);
        return new Date(y, m - 1, d);
    };

    for (let i = 1; i < allDays.length; i++) {
        const prev = toDate(allDays[i - 1]);
        const cur = toDate(allDays[i]);
        const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);

        if (diffDays === 1) {
            run += 1;
            longest = Math.max(longest, run);
        } else {
            run = 1;
        }
    }

    // current streak (ending yesterday)
    const anchor = new Date();
    anchor.setDate(anchor.getDate() - 1);

    let current = 0;

    for (let i = 0; ; i++) {
        const d = new Date(anchor);
        d.setDate(anchor.getDate() - i);

        const k = dayKeyLocal(d);
        if (daySet.has(k)) current += 1;
        else break;
    }


    return { currentStreak: current, longestStreak: longest };
}
