import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSupabaseWithClerk } from "@/supabase/client";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

import { IMAGE_BUCKET } from "@/lib/constants/imageBucket";
import { PRODUCTIVITY_OPTIONS } from "@/lib/constants/productivity";
import { mapSubject } from "@/lib/mapper/subject";
import { Subject } from "@/lib/model/subject";
import { uploadEntryImage, uriToArrayBuffer } from "@/lib/supabase/image";
import { createEntry } from "@/lib/supabase/journalEntry/createEntry";
import { deleteEntry } from "@/lib/supabase/journalEntry/deleteEntry";
import { setEntrySubjects } from "@/lib/supabase/journalEntry/setEntrySubjects";
import { updateEntry } from "@/lib/supabase/journalEntry/updateEntry";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";

/**
 * Props:
 * - create: optional promptTitle/promptText to prefill
 * - edit: entryId is required
 */
type Props =
    | { mode: "create"; promptTitle?: string; promptText?: string }
    | { mode: "edit"; entryId: string };

export default function EntryEditorScreen(props: Props) {
    const router = useRouter();

    const { getToken, userId, isLoaded } = useAuth();
    const supabase = useMemo(() => getSupabaseWithClerk(getToken), [getToken]);

    const isEdit = props.mode === "edit";
    const entryId = isEdit ? props.entryId : null;

    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [productivity, setProductivity] = useState(3);
    const [subjectIds, setSubjectIds] = useState<string[]>([]);

    // UI image preview uri:
    // create mode: local file:// uri if picked
    // edit mode: public URL (if bucket is public) OR local file:// when replaced
    const [imageUri, setImageUri] = useState<string | null>(null);

    // original storage path (edit mode)
    const [originalImagePath, setOriginalImagePath] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Subjects chips
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(true);

    // Entry loading (edit)
    const [initialLoading, setInitialLoading] = useState(false);

    // Prevent late load overwriting user typing
    const [hydrated, setHydrated] = useState(false);

    // edit route must have entryId
    useEffect(() => {
        if (!isLoaded) return;
        if (isEdit && !entryId) router.back();
    }, [isLoaded, isEdit, entryId, router]);

    // prefill for CREATE mode
    useEffect(() => {
        if (!isLoaded) return;
        if (isEdit) return;
        if (hydrated) return;

        const promptTitle = props.mode === "create" && typeof props.promptTitle === "string" ? props.promptTitle : "";
        const promptText = props.mode === "create" && typeof props.promptText === "string" ? props.promptText : "";

        setTitle(promptTitle);
        setContent(promptText);
        setProductivity(3);
        setHydrated(true);
    }, [isLoaded, isEdit, hydrated, props]);

    // ---- Load subjects (chips) ----
    useEffect(() => {
        if (!isLoaded) return;

        let cancelled = false;

        (async () => {
            try {
                setSubjectsLoading(true);
                const rows = await listSubjects(supabase, { onlyActive: true });
                if (!cancelled) setSubjects(rows.map(mapSubject));
            } catch (e) {
                console.error("listSubjects failed:", e);
                Alert.alert("Error", "Failed to load subjects.");
            } finally {
                if (!cancelled) setSubjectsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isLoaded]);

    // ---- Load entry if EDITING ----
    useEffect(() => {
        if (!isLoaded) return;
        if (!isEdit || !entryId) return;
        if (hydrated) return; // don't reload/overwrite if already hydrated

        let cancelled = false;

        (async () => {
            try {
                setInitialLoading(true);

                const { data, error } = await supabase
                    .from("journal_entries")
                    .select(
                        `
            id,
            title,
            content,
            productivity,
            image_path,
            entry_subjects(subject_id)
          `
                    )
                    .eq("id", entryId)
                    .single();

                if (error) throw error;
                if (cancelled) return;

                setTitle(data.title ?? "");
                setContent(data.content ?? "");
                setProductivity(typeof data.productivity === "number" ? data.productivity : 3);

                const loadedSubjectIds = (data.entry_subjects ?? []).map((x: any) => x.subject_id);
                setSubjectIds(loadedSubjectIds);

                const imgPath = data.image_path ?? null;
                setOriginalImagePath(imgPath);

                // Optional: if bucket is public, preview it
                if (imgPath) {
                    const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imgPath);
                    if (pub?.publicUrl) setImageUri(pub.publicUrl);
                    else setImageUri(null);
                } else {
                    setImageUri(null);
                }

                setHydrated(true);
            } catch (e) {
                console.error("Failed to load entry:", e);
                Alert.alert("Error", "Failed to load this entry.");
                router.back();
            } finally {
                if (!cancelled) setInitialLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isLoaded, isEdit, entryId, hydrated, router]);

    const toggleSubject = (id: string) => {
        setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    // pick one image from gallery
    const pickImage = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
            Alert.alert("Permission needed", "Please allow photo access to add an image.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            selectionLimit: 1,
        });

        if (result.canceled) return;

        const uri = result.assets?.[0]?.uri;
        if (uri) setImageUri(uri); // local file:// uri
    };

    const removeImage = () => setImageUri(null);

    const handleCancel = () => {
        Alert.alert(isEdit ? "Discard Changes?" : "Discard Entry?", "Are you sure?", [
            { text: "Keep Writing", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]);
    };

    const onPressSave = async () => {
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            Alert.alert("Missing content", "Please write something before saving.");
            return;
        }

        if (subjectIds.length === 0) {
            Alert.alert("No subject selected", "Select at least 1 subject (or choose Other).");
            return;
        }

        if (!userId) {
            Alert.alert("Error", "User not authenticated.");
            return;
        }

        try {
            setSaving(true);

            // 1) Create or update entry main row
            let entryIdToUse = entryId ?? "";

            if (!isEdit) {
                const created = await createEntry(supabase, {
                    title: title.trim() || null,
                    content: trimmedContent,
                    productivity,
                    subjectIds,
                    entryTimestamp: new Date(),
                    clerkUserId: userId,
                });
                entryIdToUse = created.id;

                // Create mode: image upload (if any)
                if (imageUri) {
                    const { bytes, contentType, fileName } = await uriToArrayBuffer(imageUri);

                    const path = await uploadEntryImage(supabase, {
                        bucket: IMAGE_BUCKET,
                        clerkUserId: userId,
                        entryId: entryIdToUse,
                        fileName,
                        contentType,
                        data: bytes,
                    });

                    await updateEntry(supabase, entryIdToUse, { imagePath: path });
                }
            } else {
                // Update mode: update main fields
                entryIdToUse = entryId!;

                await updateEntry(supabase, entryIdToUse, {
                    title: title.trim() || null,
                    content: trimmedContent,
                    productivity,
                });

                // Update subjects
                await setEntrySubjects(supabase, entryIdToUse, subjectIds);

                // 2) Image logic: keep / remove / replace
                const pickedNewLocal = !!imageUri && imageUri.startsWith("file:");

                // Removed old image
                if (!imageUri && originalImagePath) {
                    await updateEntry(supabase, entryIdToUse, { imagePath: null });
                    setOriginalImagePath(null);
                }

                // Replaced with new local image
                if (pickedNewLocal) {
                    const { bytes, contentType, fileName } = await uriToArrayBuffer(imageUri);

                    const newPath = await uploadEntryImage(supabase, {
                        bucket: IMAGE_BUCKET,
                        clerkUserId: userId,
                        entryId: entryIdToUse,
                        fileName,
                        contentType,
                        data: bytes,
                    });

                    await updateEntry(supabase, entryIdToUse, { imagePath: newPath });
                    setOriginalImagePath(newPath);
                }
            }

            Alert.alert(isEdit ? "Updated" : "Saved", isEdit ? "Your entry has been updated." : "Your entry has been saved.");
            router.back();
        } catch (error) {
            console.error("Failed to save journal entry:", error);
            Alert.alert("Error", "Failed to save your journal entry. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const onPressDelete = () => {
        if (!isEdit || !entryId) return;

        Alert.alert(
            "Delete entry?",
            "This will permanently delete this entry.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        if (!userId) {
                            Alert.alert("Error", "User not authenticated.");
                            return;
                        }

                        try {
                            setDeleting(true);
                            await deleteEntry(supabase, entryId); // handles DB + storage
                            Alert.alert("Deleted", "Entry has been deleted.");
                            router.back();
                        } catch (e) {
                            console.error("deleteEntry failed:", e);
                            Alert.alert("Error", "Failed to delete entry.");
                        } finally {
                            setDeleting(false);
                            router.push("/entries");
                        }
                    },
                },
            ]
        );
    };
    const headerTitle = isEdit ? "Edit Entry" : "New Entry";

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{headerTitle}</Text>

                    <TouchableOpacity
                        onPress={onPressSave}
                        style={[styles.headerBtn, (saving || initialLoading) && { opacity: 0.6 }]}
                        disabled={saving || initialLoading || deleting}
                    >
                        <Text style={styles.headerBtnText}>
                            {saving ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update" : "Save"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    {initialLoading ? <Text style={styles.helperText}>Editing entry...</Text> :
                        <View>

                            <Text style={styles.sectionLabel}>Title (optional)</Text>
                            <TextInput
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., Calculus practice"
                                placeholderTextColor="#9ca3af"
                                style={styles.input}
                                returnKeyType="next"
                            />

                            {/* Productivity */}
                            <Text style={styles.sectionLabel}>Productivity</Text>
                            <View style={styles.productivityRow}>
                                {PRODUCTIVITY_OPTIONS.map((opt) => {
                                    const selected = opt.value === productivity;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => setProductivity(opt.value)}
                                            style={[
                                                styles.productivityChip,
                                                selected && { borderColor: opt.color, backgroundColor: "#f9fafb" },
                                            ]}
                                        >
                                            <MaterialIcons
                                                size={18}
                                                name={opt.icon as ComponentProps<typeof MaterialIcons>["name"]}
                                                color={opt.color}
                                            />
                                            <Text style={styles.productivityText}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Subjects */}
                            <Text style={styles.sectionLabel}>Subjects</Text>
                            <Text style={styles.helperText}>Tap to select multiple</Text>

                            <View style={styles.subjectsWrap}>
                                {subjectsLoading ? (
                                    <Text style={styles.helperText}>...</Text>
                                ) : subjects.length === 0 ? (
                                    <Text style={styles.helperText}>No active subjects found.</Text>
                                ) : (
                                    subjects.map((s) => {
                                        const selected = subjectIds.includes(s.id);
                                        const label = s.name ?? "Untitled";
                                        return (
                                            <TouchableOpacity
                                                key={s.id}
                                                onPress={() => toggleSubject(s.id)}
                                                style={[
                                                    styles.subjectChip,
                                                    selected ? { backgroundColor: s.color, borderColor: s.color } : { borderColor: "#e5e7eb" },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.subjectChipText,
                                                        selected ? { color: "#fff" } : { color: "#111827" },
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                            {/* Content */}
                            <Text style={styles.sectionLabel}>What did you study today?</Text>
                            <TextInput
                                value={content}
                                onChangeText={setContent}
                                placeholder="Write your reflection… What did you learn? What was hard? What will you do tomorrow?"
                                placeholderTextColor="#9ca3af"
                                style={styles.textArea}
                                multiline
                                textAlignVertical="top"
                            />
                            {/* Image */}
                            <Text style={styles.sectionLabel}>Image (optional)</Text>
                            <View style={styles.imageRow}>
                                {!imageUri ? (
                                    <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                                        <MaterialIcons size={18} name="image" color="#111827" />
                                        <Text style={styles.imageButtonText}>Add Image</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                                        <TouchableOpacity onPress={removeImage} style={styles.removeImageBtn}>
                                            <MaterialIcons size={18} name="close" color="#111827" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>



                            <TouchableOpacity
                                onPress={onPressSave}
                                style={[styles.primaryBtn, (saving || initialLoading) && { opacity: 0.7 }]}
                                disabled={saving || initialLoading}
                            >
                                <Text style={styles.primaryBtnText}>
                                    {saving ? (isEdit ? "Updating..." : "Saving...") : isEdit ? "Update Entry" : "Save Entry"}
                                </Text>
                            </TouchableOpacity>

                            {isEdit ? (
                                <TouchableOpacity
                                    onPress={onPressDelete}
                                    style={[styles.dangerBtn, (saving || deleting || initialLoading) && { opacity: 0.7 }]}
                                    disabled={saving || deleting || initialLoading}
                                >
                                    <Text style={styles.dangerBtnText}>{deleting ? "Deleting..." : "Delete Entry"}</Text>
                                </TouchableOpacity>
                            ) : null}

                        </View>}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        backgroundColor: "#ffffff",
    },
    headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
    headerBtn: { paddingVertical: 8, paddingHorizontal: 10 },
    headerBtnText: { fontSize: 14, fontWeight: "700", color: "#111827" },

    container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 10 },
    sectionLabel: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#111827", paddingBottom: 8 },
    helperText: { marginTop: -6, fontSize: 12, color: "#6b7280", paddingBottom: 5 },

    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#ffffff",
    },

    productivityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
    productivityChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "#ffffff",
    },
    productivityText: { fontSize: 12, fontWeight: "700", color: "#111827" },

    subjectsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    subjectChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#ffffff" },
    subjectChipText: { fontSize: 12, fontWeight: "700" },

    imageRow: { marginTop: 4 },
    imageButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    imageButtonText: { fontSize: 13, fontWeight: "700", color: "#111827" },
    imagePreviewContainer: {
        position: "relative",
        width: "100%",
        height: 180,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    imagePreview: { width: "100%", height: "100%" },
    removeImageBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.9)",
        alignItems: "center",
        justifyContent: "center",
    },

    textArea: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 180,
        fontSize: 15,
        color: "#111827",
        backgroundColor: "#ffffff",
        lineHeight: 22,
    },

    primaryBtn: { marginTop: 10, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#111827" },
    primaryBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 14 },

    dangerBtn: {
        marginTop: 10,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#ef4444",
        backgroundColor: "#ffffff",
    },
    dangerBtnText: {
        color: "#ef4444",
        fontWeight: "800",
        fontSize: 14,
    },

});
