import { assertOk } from "@/lib/supabase/helper";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadEntryImage(
    supabase: SupabaseClient,
    opts: {
        bucket: string; // e.g. "entry-images"
        clerkUserId: string;
        entryId: string;
        fileName: string; // e.g. "photo.jpg"
        contentType: string; // "image/jpeg"
        data: Blob | ArrayBuffer;
    }
) {
    const path = `${opts.clerkUserId}/${opts.entryId}/${opts.fileName}`;

    const up = await supabase.storage
        .from(opts.bucket)
        .upload(path, opts.data, {
            contentType: opts.contentType,
            upsert: true,
        });

    assertOk(up as any, "uploadEntryImage failed");
    return path; // store this in journal_entries.image_path
}

export function getPublicImageUrl(
    supabase: SupabaseClient,
    bucket: string,
    path: string
) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

