import Logo from "@/components/Logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppColors } from "@/constants/theme";
import { useMonthlySubjectAverages } from "@/hooks/use-monthly-subject-averages";
import { useStreaks } from "@/hooks/use-streaks";
import { DEFAULT_SUBJECTS } from "@/lib/constants/subjects";
import { formatUppercaseDate, getTimeOfDayGreeting } from "@/lib/utils/date";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  Image,
  ScrollView,
  Text,
  View,
  XStack,
  YStack
} from "tamagui";


type CalendarDay = {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  hasEntry: boolean; // mock
};

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Mock: pretend these local dates have entries
function getMockLoggedDateKeys(now: Date) {
  const keys = new Set<string>();
  const mk = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // Example pattern: logged on a few days this week + a few random days in month
  const d1 = new Date(now); d1.setDate(now.getDate());
  const d2 = new Date(now); d2.setDate(now.getDate() - 1);
  const d3 = new Date(now); d3.setDate(now.getDate() - 3);
  const d4 = new Date(now); d4.setDate(5);
  const d5 = new Date(now); d5.setDate(12);

  [d1, d2, d3, d4, d5].forEach(d => keys.add(mk(d)));
  return keys;
}

function monthGridDays(now: Date): CalendarDay[] {
  const loggedKeys = getMockLoggedDateKeys(now);
  const mk = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const year = now.getFullYear();
  const month = now.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(year, month, 1 - startDow); // start at Sunday

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({
      date: d,
      isToday: sameLocalDay(d, now),
      isCurrentMonth: d.getMonth() === month,
      hasEntry: loggedKeys.has(mk(d)),
    });
  }
  return days;
}

function weekStripDays(now: Date): CalendarDay[] {
  const loggedKeys = getMockLoggedDateKeys(now);
  const mk = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay()); // Sunday start (local)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: d,
      isToday: sameLocalDay(d, now),
      isCurrentMonth: d.getMonth() === now.getMonth(),
      hasEntry: loggedKeys.has(mk(d)),
    };
  });
}


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const formattedDate = formatUppercaseDate(now);
  const greeting = getTimeOfDayGreeting();
  const userName = "Test";
  const userImage = "https://i.pravatar.cc/111";

  const { data: monthlyAverages } = useMonthlySubjectAverages();
  const { currentStreak, longestStreak } = useStreaks();

  const avgMap = new Map(monthlyAverages.map((x) => [x.subjectId, x]));

  const subjectRows = DEFAULT_SUBJECTS.map((s) => {
    const row = avgMap.get(s.id);
    return {
      id: s.id,
      title: s.title,
      color: s.color,
      avg: row?.avg ?? null,
      count: row?.count ?? 0,
    };
  });


  return (
    <View style={styles.container} >
      <ScrollView
        px="$4"
        style={{ ...styles.content, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBlockEnd: 24 }}
      >
        {/* Header */}
        {/* Top header bar */}
        <XStack style={{ alignItems: "center", justifyContent: "space-between" }} mt="$4" mb="$3">
          <XStack gap="$3" style={{ alignItems: "center" }}>
            <Logo/>
            <YStack>
              <Text fontSize="$2" color="$color10" textTransform="uppercase" fontWeight="600">
                {formattedDate}
              </Text>
              <Text fontSize="$6" fontWeight="700" color="$color12">
                {greeting}, {userName}
              </Text>
            </YStack>
          </XStack>

          {/* Right side: small icon bubble (optional) */}
          <Pressable onPress={() => router.push("/profile")} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
            <Image source={{ uri: userImage }} style={styles.headerBadge}/>
          </Pressable>
        </XStack>

        {/* Week chips */}
        <XStack style={{ justifyContent: "space-between" }} mb="$6">
          {weekStripDays(now).map((day) => {
            const dayName = day.date.toLocaleDateString("en-US", { weekday: "short" });
            const dayNumber = day.date.getDate();

            return (
              <YStack key={dayName + dayNumber} gap="$1" style={{ alignItems: "center" }}>
                <Text fontSize="$2" color="$color10" fontWeight="600">
                  {dayName}
                </Text>

                <View style={[
                  styles.dayCircle,
                  day.isToday && styles.todayCircle,
                  day.hasEntry && styles.loggedRing,
                ]}>
                  <Text
                    fontSize="$3"
                    color={day.isToday ? "white" : "$color11"}
                    fontWeight={day.isToday ? "700" : "500"}
                  >
                    {dayNumber}
                  </Text>
                </View>

                {/* tiny dot */}
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
                <Text fontSize="$8" fontWeight="800" color={currentStreak > 0 ? AppColors.primaryDark : AppColors.gray800}>
                  {currentStreak}
                  <Text fontSize="$5" fontWeight="700" color={AppColors.gray800}>
                    {" "}days
                  </Text>
                </Text>
                <Text mt="$2" fontSize="$2" color="$color10">
                  Longest streak: {longestStreak} days
                </Text>

              </YStack>

              <View style={styles.streakIcon}>
                <IconSymbol size={22} name="flame.fill" color={currentStreak > 0 ? AppColors.flameRed : AppColors.gray300} />
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

              <YStack gap="$3">
                {subjectRows.map((row) => {
                  const hasData = row.avg !== null;
                  const avg = row.avg ?? 0;

                  // bar percent based on 1..5 -> 0..100
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
                            avg >= 4 ? " 🔥🔥🔥"
                              : avg >= 3 ? " 🔥🔥"
                                : avg >= 2 ? "🔥"
                                  : avg >= 1 ? "😓"
                                    : "😴"
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
              </YStack>
            </YStack>
          </Card>
        </YStack>

        {/* Action Buttons */}
        <YStack gap="$3" mb="$6">
          <Pressable onPress={() => router.push("/new-entry")} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
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
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.white },
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
});
