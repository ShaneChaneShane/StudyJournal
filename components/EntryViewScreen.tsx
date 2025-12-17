import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSupabaseWithClerk } from "@/supabase/client";
import { useAuth } from "@clerk/clerk-expo";

import { IMAGE_BUCKET } from "@/lib/constants/imageBucket";
import { PRODUCTIVITY_OPTIONS } from "@/lib/constants/productivity";
import { mapSubject } from "@/lib/mapper/subject";
import { Subject } from "@/lib/model/subject";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";
import { formatLongDate, formatTime } from "@/lib/utils/date";
import { Spinner } from "tamagui";

type SubjectLookup = Record<string, { name: string; color: string }>;

type Props = { entryId: string };

export default function EntryViewScreen({ entryId }: Props) {
    const router = useRouter();
    const { getToken, isLoaded } = useAuth();
    const supabase = useMemo(() => getSupabaseWithClerk(getToken), [getToken]);

    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<string>("");
    const [productivity, setProductivity] = useState<number>(3);
    const [entryTimestamp, setEntryTimestamp] = useState<Date | null>(null);

    const [subjectIds, setSubjectIds] = useState<string[]>([]);
    const [subjectLookup, setSubjectLookup] = useState<SubjectLookup>({});

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imagePath, setImagePath] = useState<string | null>(null);

    const productivityMeta = useMemo(() => {
        return PRODUCTIVITY_OPTIONS.find((x) => x.value === productivity) ?? PRODUCTIVITY_OPTIONS[2];
    }, [productivity]);

    const load = async () => {
        try {
            setLoading(true);

            // 1) Load subjects (for lookup)
            const subjectRows = await listSubjects(supabase, { onlyActive: true });
            const mapped: Subject[] = subjectRows.map(mapSubject);

            const lookup: SubjectLookup = {};
            for (const s of mapped) {
                lookup[s.id] = { name: s.name, color: s.color };
            }
            setSubjectLookup(lookup);

            // 2) Load entry + entry_subjects
            const { data, error } = await supabase
                .from("journal_entries")
                .select(
                    `
        id,
        title,
        content,
        productivity,
        image_path,
        entry_timestamp,
        created_at,
        entry_subjects(subject_id)
      `
                )
                .eq("id", entryId)
                .single();

            if (error) throw error;

            setTitle(data.title ?? "");
            setContent(data.content ?? "");
            setProductivity(typeof data.productivity === "number" ? data.productivity : 3);
            setEntryTimestamp(data.entry_timestamp);
            const loadedSubjectIds = (data.entry_subjects ?? []).map((x: any) => x.subject_id).filter(Boolean);
            setSubjectIds(loadedSubjectIds);

            const imgPath = data.image_path ?? null;
            setImagePath(imgPath);

            if (imgPath) {
                // preview (works if bucket is public)
                const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(imgPath);
                setImageUri(pub?.publicUrl ?? null);
            } else {
                setImageUri(null);
            }
        } catch (e) {
            console.error("Failed to load entry view:", e);
            Alert.alert("Error", "Failed to load this entry.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        if (!entryId) return;
        load();
    }, [isLoaded, entryId, router]);


    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    const handleEdit = () => {
        router.push({ pathname: "/entry/[entryId]/edit", params: { entryId } });
    };

    const shownSubjectIds = useMemo(() => {
        const uniq = Array.from(new Set(subjectIds)).filter(Boolean);
        return uniq;
    }, [subjectIds]);
    if (loading)
        return <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
            {/* Header */}
            < View style={styles.header} >
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Entry</Text>

                <TouchableOpacity onPress={handleEdit} style={styles.headerBtn} disabled={loading}>
                    <Text style={[styles.headerBtnText, loading && { opacity: 0.5 }]}>Edit</Text>
                </TouchableOpacity>
            </View >

            <ScrollView contentContainerStyle={styles.container}>
                <View>
                    <Spinner size="large" />
                </View>
            </ScrollView >
        </SafeAreaView >
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                    <Text style={styles.headerBtnText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Entry</Text>

                <TouchableOpacity onPress={handleEdit} style={styles.headerBtn} disabled={loading}>
                    <Text style={[styles.headerBtnText, loading && { opacity: 0.5 }]}>Edit</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                {/* Title */}
                <Text style={styles.titleText}>{title?.trim() ? title : "Untitled"}</Text>

                {/* Meta card */}
                <View style={styles.metaCard}>
                    {/* Date + Time */}
                    {(entryTimestamp || "") && (
                        <View style={styles.dateRow}>
                            <Text style={styles.dateText}>
                                {entryTimestamp ? formatLongDate(entryTimestamp) : ""}
                            </Text>
                            <Text style={styles.timeText}>
                                {entryTimestamp ? formatTime(entryTimestamp) : ""}
                            </Text>
                        </View>
                    )}
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Subjects</Text>
                        <View style={styles.subjectsWrap}>
                            {shownSubjectIds.length === 0 ? (
                                <Text style={styles.helperText}>No subjects</Text>
                            ) : (
                                shownSubjectIds.map((id) => {
                                    const s = subjectLookup[id];
                                    const name = s?.name ?? "Unknown";
                                    const color = s?.color ?? "#6b7280";
                                    return (
                                        <View
                                            key={id}
                                            style={[styles.subjectPill, { backgroundColor: color }]}
                                        >
                                            <Text style={styles.subjectPillText}>{name}</Text>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    </View>

                    <View style={[styles.metaRow, { marginTop: 12 }]}>
                        <Text style={styles.metaLabel}>Productivity</Text>
                        <View style={styles.productivityRow}>
                            <MaterialIcons
                                size={18}
                                name={productivityMeta.icon as any}
                                color={productivityMeta.color}
                            />
                            <Text style={styles.productivityText}>{productivityMeta.label}</Text>
                        </View>
                    </View>
                </View>


                {/* Content */}
                <Text style={styles.contentText}>{content?.trim() ? content : "No content"}</Text>

                {/* Image */}
                {imageUri ? (
                    <View style={styles.imageCard}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    </View>
                ) : (
                    <Text style={styles.helperText}>{imagePath ? "Image exists but cannot preview." : "No image"}</Text>
                )}
            </ScrollView>

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
    sectionLabel: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#111827" },
    helperText: { marginTop: 4, fontSize: 12, color: "#6b7280" },
    metaCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 14,
    },
    metaRow: { gap: 8 },
    metaLabel: { fontSize: 12, fontWeight: "800", color: "#6b7280", letterSpacing: 0.6, textTransform: "uppercase" },
    titleText: { fontSize: 22, fontWeight: "800", color: "#111827", lineHeight: 28 },
    contentText: { fontSize: 16, color: "#111827", lineHeight: 26 },

    subjectsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    subjectPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    subjectPillText: { fontSize: 12, fontWeight: "800", color: "#ffffff" },

    productivityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    productivityText: { fontSize: 14, fontWeight: "700", color: "#111827" },

    imageCard: {
        width: "100%",
        height: 240,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#f9fafb",
    },
    imagePreview: { width: "100%", height: "100%" },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#6b7280",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    timeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#9ca3af",
    },
});
