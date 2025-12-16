import { assertOk } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function reorderSubject(
    supabase: SupabaseClient,
    input: {
        subjectId: string;
        fromOrder: number;
        toOrder: number;
    }
) {
    const { subjectId, fromOrder, toOrder } = input;

    if (fromOrder === toOrder) return;

    const min = Math.min(fromOrder, toOrder);
    const max = Math.max(fromOrder, toOrder);

    const res = await supabase
        .from("subjects")
        .select("id, sort_order")
        .gte("sort_order", min)
        .lte("sort_order", max)
        .order("sort_order");

    const subjects = assertOk(res, "reorderSubject fetch failed");

    for (const s of subjects) {
        if (s.id === subjectId) continue;

        let newOrder = s.sort_order;

        // moving up
        if (toOrder < fromOrder) {
            newOrder += 1;
        }

        // moving down
        if (toOrder > fromOrder) {
            newOrder -= 1;
        }

        await supabase
            .from("subjects")
            .update({ sort_order: newOrder })
            .eq("id", s.id);
    }

    await supabase
        .from("subjects")
        .update({ sort_order: toOrder })
        .eq("id", subjectId);
}
