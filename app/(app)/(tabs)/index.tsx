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
  H1,
  ScrollView,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const now = new Date();
  const formattedDate = formatUppercaseDate(now);
  const greeting = getTimeOfDayGreeting();
  const userName = "Test";


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
    <View style={styles.container}>
      <ScrollView
        px="$4"
        style={{ ...styles.content, paddingTop: insets.top }}
        contentContainerStyle={{ paddingBlockEnd: 24 }}
      >
        {/* Header */}
        <YStack gap="$2" style={{ alignItems: "center" }} mt="$4">
          <Logo />
          <Text fontSize="$2" color="$color10" textTransform="uppercase" fontWeight="500">
            {formattedDate}
          </Text>
        </YStack>

        {/* Greeting */}
        <YStack gap="$2" style={{ alignItems: "center" }} mb="$4">
          <H1 fontSize="$8" fontWeight="600" style={{ textAlign: "center" }} color="$color12">
            {greeting}, {userName}!
          </H1>
        </YStack>

        {/* Weekly Calendar Strip */}
        <XStack style={{ justifyContent: "space-between" }} mb="$6">
          {Array.from({ length: 7 }, (_, i) => {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + i);

            const dayName = startOfWeek.toLocaleDateString("en-US", { weekday: "short" });
            const dayNumber = startOfWeek.getDate();
            const isToday = startOfWeek.toDateString() === now.toDateString();

            return (
              <YStack key={i} gap="$1" style={{ alignItems: "center" }}>
                <Text fontSize="$2" color="$color10" fontWeight="500">
                  {dayName}
                </Text>
                <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                  <Text
                    fontSize="$3"
                    color={isToday ? "white" : "$color11"}
                    fontWeight={isToday ? "600" : "400"}
                  >
                    {dayNumber}
                  </Text>
                </View>
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
                <Text fontSize="$8" fontWeight="800" color={currentStreak>0? AppColors.primaryDark:AppColors.gray800}>
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
                <IconSymbol size={22} name="flame.fill" color={currentStreak>0 ? AppColors.flameRed:AppColors.gray300} />
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
    </View>
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
});
