import { assertOk } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteSubject(
    supabase: SupabaseClient,
    subjectId: string
) {
    const res = await supabase.from("subjects").delete().eq("id", subjectId);
    assertOk(res as any, "deleteSubject failed");
}