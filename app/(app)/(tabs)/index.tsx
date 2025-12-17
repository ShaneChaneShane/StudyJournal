import React, { useCallback, useEffect, useMemo, useState } from "react";

import Logo from "@/components/Logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppColors } from "@/constants/theme";
import { formatUppercaseDate, getTimeOfDayGreeting } from "@/lib/utils/date";
import { getUserFirstName } from "@/lib/utils/user";

import { useAuth, useUser } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Image, ScrollView, Spinner, Text, View, XStack, YStack } from "tamagui";

import { getSupabaseWithClerk } from "@/supabase/client";


import { mapSubject } from "@/lib/mapper/subject";
import { listSubjects } from "@/lib/supabase/subject/listSubjects";

import type { CalendarDaySummary } from "@/lib/model/journalEntry";
import type { StreakInfo } from "@/lib/model/streak";
import type { Subject, SubjectAverage } from "@/lib/model/subject";
import { computeMonthlyAverages, computeStreakInfo, computeWeekSummaries } from "@/lib/supabase/dashboard/dashboardCompute";
import { listEntryMetaInRange } from "@/lib/supabase/journalEntry/listEntryMetaInRange";
import { ensureDefaultSubjects } from "@/lib/supabase/subject/ensureDefaultSubjects";

type CalendarDay = {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasEntry: boolean;
};

function sameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function weekRangeSundayToSaturday(now: Date) {
  const start = startOfLocalDay(new Date(now));
  start.setDate(now.getDate() - now.getDay()); // Sunday
  const end = endOfLocalDay(new Date(start));
  end.setDate(start.getDate() + 6); // Saturday
  return { start, end };
}

function makeWeekStripDays(now: Date, hasEntryKeys: Set<string>): CalendarDay[] {
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKeyLocal(d);

    return {
      date: d,
      isToday: sameLocalDay(d, now),
      isCurrentMonth: d.getMonth() === now.getMonth(),
      hasEntry: hasEntryKeys.has(key),
    };
  });
}

function productivityLabel(avg: number) {
  return avg >= 4 ? " 🔥🔥🔥"
    : avg >= 3 ? " 🔥🔥"
      : avg >= 2 ? "🔥"
        : avg >= 1 ? "😓"
          : "😴"
}

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { getToken, userId, isLoaded } = useAuth();
  const supabase = getSupabaseWithClerk(getToken);
  const insets = useSafeAreaInsets();

  const now = new Date();
  const formattedDate = formatUppercaseDate(now);
  const greeting = getTimeOfDayGreeting();
  const userName = getUserFirstName(user);
  const userImage = user?.imageUrl;

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [monthlyAverages, setMonthlyAverages] = useState<SubjectAverage[]>([]);
  const [streak, setStreak] = useState<StreakInfo>({ currentStreak: 0, longestStreak: 0 });
  const [weekSummaries, setWeekSummaries] = useState<CalendarDaySummary[]>([]);
  const loadDashboard = useCallback(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      setLoadingDashboard(true);
      setError(null);

      try {
        if (userId) await ensureDefaultSubjects(supabase, userId);

        // Fetch subjects + entry meta in parallel
        const lookbackDays = 365;

        const to = new Date();        // now
        const from = new Date(to);
        from.setDate(from.getDate() - lookbackDays);

        const [subjectRows, entriesMeta] = await Promise.all([
          listSubjects(supabase),
          listEntryMetaInRange(supabase, {
            from,
            to: new Date(to.getTime() + 24 * 60 * 60 * 1000), // include today safely
            includeSubjectIds: true,
            limit: 5000,
            offset: 0,
          }),
        ]);

        if (cancelled) return;

        const mappedSubjects = subjectRows.map(mapSubject);
        const activeSubjects = mappedSubjects
          .filter((s) => s.isActive)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        const activeSubjectIds = subjectRows.filter((s) => s.is_active).map((s) => s.id);

        // compute ranges
        const fromMonth = startOfMonth(now);
        const toMonth = endOfMonth(now);
        const { start: weekFrom, end: weekTo } = weekRangeSundayToSaturday(now);

        // compute everything in-memory (fast)
        const streakInfo = computeStreakInfo(entriesMeta, new Date());
        const avgs = computeMonthlyAverages(entriesMeta, fromMonth, toMonth, activeSubjectIds);
        const summaries = computeWeekSummaries(entriesMeta, weekFrom, weekTo);

        if (cancelled) return;

        setSubjects(activeSubjects);
        setStreak(streakInfo);
        setMonthlyAverages(avgs);
        setWeekSummaries(summaries);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load dashboard.");
        console.log("FAILED TO LOAD DASHBOARD", e);
      } finally {
        if (!cancelled) setLoadingDashboard(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId]);



  // initial load when isLoaded flips true
  useEffect(() => {
    const cleanup = loadDashboard();
    return () => cleanup?.();
  }, [loadDashboard]);

  // refresh every time screen gains focus (e.g. after router.back())
  useFocusEffect(
    useCallback(() => {
      const cleanup = loadDashboard();
      return () => cleanup?.();
    }, [loadDashboard])
  );

  const hasEntryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const s of weekSummaries) {
      if (s.entryCount > 0) keys.add(s.dateKey);
    }
    return keys;
  }, [weekSummaries]);

  const weekDays = useMemo(() => makeWeekStripDays(now, hasEntryKeys), [now, hasEntryKeys]);

  const avgMap = useMemo(() => new Map(monthlyAverages.map((x) => [x.subjectId, x])), [monthlyAverages]);

  const subjectRows = useMemo(() => {
    return subjects.map((s) => {
      const row = avgMap.get(s.id);
      return {
        id: s.id,
        title: s.name,
        color: s.color,
        avg: row?.avg ?? null,
        count: row?.count ?? 0,
      };
    });
  }, [subjects, avgMap]);

  // Clerk loading
  if (!isLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" />
        </View>
      </SafeAreaView>
    );
  }


  return (
    <View style={styles.container}>
      <ScrollView
        px="$4"
        style={{ ...styles.content, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBlockEnd: 24 }}
      >
        {/* Header */}
        <XStack style={{ alignItems: "center", justifyContent: "space-between" }} mt="$4" mb="$3">
          <XStack gap="$3" style={{ alignItems: "center" }}>
            <Logo />
            <YStack>
              <Text fontSize="$2" color="$color10" textTransform="uppercase" fontWeight="600">
                {formattedDate}
              </Text>
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {userName ? `${greeting}, ${userName}` : greeting}
              </Text>
            </YStack>
          </XStack>

          <Pressable onPress={() => router.push("/profile")} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
            <Image source={{ uri: userImage }} style={styles.headerBadge} />
          </Pressable>
        </XStack>

        {/* Optional error banner */}
        {error ? (
          <Card bordered padding="$3" bg="white" borderColor="$borderColor" mb="$4">
            <Text fontSize="$3" fontWeight="700" color="$color12">
              Could not load some data
            </Text>
            <Text mt="$1" fontSize="$2" color="$color10">
              {error}
            </Text>
          </Card>
        ) : null}

        {/* Week chips */}
        <XStack style={{ justifyContent: "space-between" }} mb="$6">
          {weekDays.map((day) => {
            const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNumber = day.date.getDate();

            return (
              <YStack key={dayName + dayNumber} gap="$1" style={{ alignItems: "center" }}>
                <Text fontSize="$2" color="$color10" fontWeight="600">
                  {dayName}
                </Text>

                <View style={[styles.dayCircle, day.isToday && styles.todayCircle, day.hasEntry && styles.loggedRing]}>
                  <Text
                    fontSize="$3"
                    color={day.isToday ? "white" : "$color11"}
                    fontWeight={day.isToday ? "700" : "500"}
                  >
                    {dayNumber}
                  </Text>
                </View>

                <View style={[styles.dot, { opacity: day.hasEntry ? 1 : 0 }]} />
              </YStack>
            );
          })}
        </XStack>

        {/* Dashboard */}
        <YStack gap="$3" mb="$6">
          <Text fontSize="$6" fontWeight="700" color="$color12">
            Dashboard
          </Text>

          {/* Streak card */}
          <Card elevate bordered padding="$4" bg="white" borderColor="$borderColor">
            <XStack style={{ justifyContent: "space-between", alignItems: "center" }}>
              <YStack gap="$1">
                <Text
                  fontSize="$8"
                  fontWeight="800"
                  color={streak.currentStreak > 0 ? AppColors.primaryDark : AppColors.gray800}
                >
                  {streak.currentStreak}
                  <Text fontSize="$5" fontWeight="700" color={AppColors.gray800}>
                    {" "}
                    days
                  </Text>
                </Text>
                <Text mt="$2" fontSize="$2" color="$color10">
                  Longest streak: {streak.longestStreak} days
                </Text>
              </YStack>

              <View style={styles.streakIcon}>
                <IconSymbol
                  size={22}
                  name="flame.fill"
                  color={streak.currentStreak > 0 ? AppColors.flameRed : AppColors.gray300}
                />
              </View>
            </XStack>

            <Text mt="$2" fontSize="$2" color="$color10">
              Keep writing study journal daily to maintain your streak!
            </Text>
          </Card>

          {/* Monthly subject averages */}
          <Card elevate bordered padding="$4" bg="white" borderColor="$borderColor">
            <YStack gap="$3">
              <XStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                <Text fontSize="$4" fontWeight="700" color="$color12">
                  This Month Average Productivity
                </Text>
              </XStack>

              <YStack gap="$3" style={{ position: "relative" }}>
                {
                  subjectRows.length === 0 ?
                    <Text fontSize="$2" color="$color10">
                      Start writing now to start this month productivity analysis!
                    </Text> : null
                }
                {subjectRows.map((row) => {
                  const hasData = row.avg !== null;
                  const avg = row.avg ?? 0;
                  const percent = hasData ? Math.round((avg / 5) * 100) : 0;

                  return (
                    <YStack key={row.id} gap="$2" opacity={hasData ? 1 : 0.35}>
                      <XStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <XStack gap="$2" style={{ alignItems: "center" }}>
                          <View style={[styles.subjectDot, { backgroundColor: row.color }]} />
                          <Text fontSize="$3" fontWeight="700" color="$color12">
                            {row.title}
                          </Text>
                          <Text fontSize="$2" color="$color10">
                            {hasData ? `(${row.count} entries)` : "(no entries)"}
                          </Text>
                        </XStack>

                        <Text fontSize="$3" fontWeight="800" color="$color12">
                          {hasData ? (
                            productivityLabel(avg)
                          )
                            : "—"}
                        </Text>
                      </XStack>

                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: row.color }]} />
                      </View>
                    </YStack>
                  );
                })}
                {loadingDashboard && (
                  <View style={styles.loadingOverlay}>
                    <Spinner size="large" />
                  </View>
                )}

              </YStack>
            </YStack>
          </Card>
        </YStack>

        {/* Action Buttons */}
        <YStack gap="$3" mb="$6">
          <Pressable onPress={() => router.push("/entry/new")} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
            <Card elevate size="$4" bordered bg={AppColors.primary} borderColor={AppColors.primary} padding="$4">
              <XStack gap="$3" style={{ alignItems: "center", justifyContent: "center" }}>
                <IconSymbol size={24} name="plus.circle.fill" color={AppColors.white} />
                <Text fontSize="$5" fontWeight="600" color="white">
                  Add New Entry
                </Text>
              </XStack>
            </Card>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(app)/(tabs)/entries")}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Card elevate size="$4" bordered bg="white" borderColor="$borderColor" padding="$4">
              <XStack gap="$3" style={{ alignItems: "center", justifyContent: "center" }}>
                <IconSymbol size={24} name="book.fill" color={AppColors.primary} />
                <Text fontSize="$5" fontWeight="600" color="$color12">
                  View Entries
                </Text>
              </XStack>
            </Card>
          </Pressable>
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },

  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderColor: AppColors.gray300,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  todayCircle: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },

  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.gray200,
    backgroundColor: AppColors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  barTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
  headerBadge: {
    width: 45,
    height: 45,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.gray200,
    backgroundColor: AppColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primary,
    marginTop: 2,
  },
  loggedRing: {
    borderColor: AppColors.primary,
    borderWidth: 2,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "rgba(0, 0, 0, 0.05)", // light gray overlay
    justifyContent: "center",
    alignItems: "center",

    borderRadius: 12, // optional: match card rounding
    zIndex: 10,
  },
});
