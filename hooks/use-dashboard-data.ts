
import { getStreakInfo } from "@/lib/supabase/dashboard/getStreakInfo";
import { getSubjectAveragesInRange } from "@/lib/supabase/dashboard/getSubjectAveragesInRange";
import { ensureDefaultSubjects } from "@/lib/supabase/subject/ensureDefaultSubjects";
import { getSupabaseWithClerk } from "@/supabase/client";
import { useAuth } from "@clerk/clerk-expo";

export function useDashboardData() {
    const { getToken, userId } = useAuth();
    const supabase = getSupabaseWithClerk(getToken);

    const load = async () => {
        if (!userId) throw new Error("No userId");

        await ensureDefaultSubjects(supabase, userId);

        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        const [avgRows, streak] = await Promise.all([
            getSubjectAveragesInRange(supabase, { from, to }),
            getStreakInfo(supabase),
        ]);

        return { avgRows, streak };
    };

    return { load };
    // abgrows:SubjectAverageRow[] , streak:{currentStreak, longestStreak}
}
