import type { SupabaseClient } from "@supabase/supabase-js";
import * as LegacyFS from "expo-file-system/legacy";

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

    const { data, error } = await supabase.storage
        .from(opts.bucket)
        .upload(path, opts.data, {
            contentType: opts.contentType,
            upsert: true,
        });
    if (error) throw error;
    if (!data?.path) throw new Error("Upload succeeded but no path returned");

    return path;
}

export function getPublicImageUrl(
    supabase: SupabaseClient,
    bucket: string,
    path: string
) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
}

function guessContentType(uri: string): { contentType: string; ext: string } {
    const clean = uri.split("?")[0];
    const ext = (clean.split(".").pop() || "jpg").toLowerCase();

    if (ext === "png") return { contentType: "image/png", ext: "png" };
    if (ext === "webp") return { contentType: "image/webp", ext: "webp" };
    if (ext === "heic") return { contentType: "image/heic", ext: "heic" };
    return { contentType: "image/jpeg", ext: "jpg" };
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = globalThis.atob
        ? globalThis.atob(base64)
        : Buffer.from(base64, "base64").toString("binary");

    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

export async function uriToArrayBuffer(uri: string): Promise<{
    bytes: ArrayBuffer;
    contentType: string;
    fileName: string;
}> {
    const { contentType, ext } = guessContentType(uri);
    const fileName = `photo-${Date.now()}.${ext}`;

    const base64 = await LegacyFS.readAsStringAsync(uri, {
        encoding: "base64",
    });

    return {
        bytes: base64ToArrayBuffer(base64),
        contentType,
        fileName,
    };
}
