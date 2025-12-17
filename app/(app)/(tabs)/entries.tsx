import { AppColors } from "@/constants/theme";
import { getProductivityConfig } from "@/lib/constants/productivity";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { type ComponentProps, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View } from "tamagui";

import { listEntriesInRange } from "@/lib/supabase/journalEntry/listEntriesInRange";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";

import { IMAGE_BUCKET } from "@/lib/constants/imageBucket";
import { mapEntryWithSubject } from "@/lib/mapper/journalEntry";
import { mapSubject } from "@/lib/mapper/subject";
import { EntryWithSubjects } from "@/lib/model/journalEntry";
import { getPublicImageUrl } from "@/lib/supabase/image";
import { getSupabaseWithClerk } from "@/supabase/client";
import { useAuth } from "@clerk/clerk-expo";


type SubjectLike = {
  id: string;
  name: string;
  color: string;
};

type SubjectLookup = Record<string, { name: string; color: string }>;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toDate(x: EntryWithSubjects["createdAt"]) {
  if (!x) return new Date();
  return new Date(x);
}

// Group by local day key: YYYY-MM-DD
function dayKeyLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type Grouped = { dateKey: string; entries: EntryWithSubjects[] };

function groupEntriesByDay(entries: EntryWithSubjects[]): Grouped[] {
  const groups: Record<string, EntryWithSubjects[]> = {};

  for (const e of entries) {
    const dt = toDate(e.entryTimestamp);
    const key = dayKeyLocal(dt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  const sortedDays = Object.keys(groups).sort((a, b) => {
    // keys are YYYY-MM-DD => lexicographic works
    return b.localeCompare(a);
  });

  return sortedDays.map((dateKey) => {
    const dayEntries = groups[dateKey] ?? [];
    dayEntries.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
    return { dateKey, entries: dayEntries };
  });
}

function extractPreview(entry: EntryWithSubjects) {
  const text = entry.content;

  if (typeof text !== "string" || text.trim().length === 0) {
    return "No content";
  }

  return text.slice(0, 100);
}


export default function EntriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const supabase = getSupabaseWithClerk(getToken);

  const [entries, setEntries] = useState<EntryWithSubjects[]>([]);
  const [subjectLookup, setSubjectLookup] = useState<SubjectLookup>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const from = useMemo(() => startOfMonth(now), [now.getFullYear(), now.getMonth()]);
  const to = useMemo(() => endOfMonth(now), [now.getFullYear(), now.getMonth()]);

  const load = async () => {
    try {
      const subjectRows = await listSubjects(supabase);
      const mappedSubjects: SubjectLike[] = subjectRows.map(mapSubject);

      const lookup: SubjectLookup = {};
      for (const s of mappedSubjects) {
        lookup[s.id] = { name: s.name, color: s.color };
      }
      setSubjectLookup(lookup);

      const fetched = await listEntriesInRange(supabase, { from, to });

      setEntries((fetched.map(mapEntryWithSubject)) ?? []);
    } catch (e) {
      console.error("Failed to load entries:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [from.getTime(), to.getTime()]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [])
  );

  const grouped = useMemo(() => groupEntriesByDay(entries), [entries]);

  const handleEntryPress = (entryId: string) => {
    router.push(`/entry/${entryId}`);
  };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>Loading your journal entries...</Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Entries Yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the + button to write your first study journal entry!
        </Text>
      </View>
    );
  }

  return (
    <View bg="$background" style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressBackgroundColor={AppColors.white}
            progressViewOffset={0}
          />
        }
      >
        <Text style={styles.title}>Your Study Journal</Text>

        {grouped.map(({ dateKey, entries: dayEntries }) => {
          // display date header in a nice format (local time)
          const headerDate = new Date(`${dateKey}T00:00:00`);
          const headerText = headerDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          return (
            <View key={dateKey} style={styles.dayGroup}>
              <Text style={styles.dateHeader}>{headerText}</Text>

              {dayEntries.map((entry) => {
                const entryId = entry.id ?? "";
                const dt = toDate(entry.createdAt);

                const productivityConfig = getProductivityConfig(entry.productivity);
                const preview = extractPreview(entry);
                const imagePath = entry.imagePath;

                const thumbnailUri = imagePath
                  ? getPublicImageUrl(supabase, IMAGE_BUCKET, imagePath)
                  : null;
                const ids = entry.subjectIds ?? [];
                const uniqueIds = Array.from(new Set(ids)).filter(Boolean);

                const maxShow = 3;
                const shown = uniqueIds.slice(0, maxShow);
                const extraCount = uniqueIds.length - shown.length;

                const title =
                  entry.title ??
                  dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                return (
                  <View key={entryId || String(dt.getTime())} style={styles.entryCardContainer}>
                    <View style={styles.subjectPillsRow}>
                      {shown.map((id) => {
                        const subject = subjectLookup[id];
                        const name = subject?.name ?? "Unknown";
                        const color = subject?.color ?? "#6b7280";

                        return (
                          <View key={id} style={[styles.subjectPill, { backgroundColor: color }]}>
                            <Text style={styles.subjectPillText}>{name}</Text>
                          </View>
                        );
                      })}

                      {extraCount > 0 && (
                        <View style={[styles.subjectPill, styles.subjectPillMuted]}>
                          <Text style={styles.subjectPillTextMuted}>{`+${extraCount}`}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.entryCard}
                      onPress={() => entryId && handleEntryPress(entryId)}
                      disabled={!entryId}
                    >
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryTitle}>{title}</Text>

                        <View style={styles.entryActions}>
                          <MaterialIcons
                            size={20}
                            name={
                              productivityConfig.icon as ComponentProps<typeof MaterialIcons>["name"]
                            }
                            color={productivityConfig.color}
                          />
                          <Text
                            style={[
                              styles.productivityLabel,
                              { color: productivityConfig.color },
                            ]}
                          >
                            {productivityConfig.label}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.entryBodyRow}>
                        <Text style={[styles.entryPreview, { flex: 1, marginBottom: 0 }]}>
                          {preview}
                          {preview.length >= 100 ? "..." : ""}
                        </Text>

                        {thumbnailUri ? (
                          <Image source={{ uri: thumbnailUri }} style={styles.entryThumbnail} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for FAB
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: AppColors.white,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: AppColors.gray800,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: AppColors.gray500,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: AppColors.gray800,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: AppColors.gray500,
    textAlign: "center",
    lineHeight: 24,
  },
  dayGroup: {
    marginBottom: 15,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: AppColors.gray500,
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray300,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  entryCardContainer: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.gray100,
  },
  entryCard: {
    backgroundColor: "transparent",
    marginTop: 5,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  entryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: AppColors.gray800,
    flex: 1,
    letterSpacing: -0.3,
  },
  entryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 12,
  },
  productivityLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  entryPreview: {
    fontSize: 16,
    color: AppColors.gray500,
    lineHeight: 26,
    marginBottom: 16,
  },
  subjectPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subjectPill: {
    paddingInline: 10,
    paddingBottom: 3,
    paddingTop: 3,
    borderRadius: 999,
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  subjectPillMuted: {
    backgroundColor: "#e5e7eb",
  },
  subjectPillTextMuted: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  entryBodyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  entryThumbnail: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: AppColors.gray100,
  },
});
