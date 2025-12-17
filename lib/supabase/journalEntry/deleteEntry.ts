import { IMAGE_BUCKET } from "@/lib/constants/imageBucket";
import { assertOk } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteEntry(supabase: SupabaseClient, entryId: string) {
    const got = await supabase
        .from("journal_entries")
        .select("id, image_path")
        .eq("id", entryId)
        .single();

    const row = assertOk(got as any, "deleteEntry load failed") as {
        id: string;
        image_path: string | null;
    };

    const imagePath = row.image_path;

    // delete joins first
    const delJoins = await supabase.from("entry_subjects").delete().eq("entry_id", entryId);
    if (delJoins.error) throw Error("deleteEntry join delete failed");

    const delEntry = await supabase.from("journal_entries").delete().eq("id", entryId);
    if (delEntry.error) throw Error("deleteEntry failed");

    // delete storage image
    if (imagePath) {
        const rm = await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
        if (rm.error) {
            console.warn("deleteEntry: storage remove failed:", rm.error);
        }
    }
}
