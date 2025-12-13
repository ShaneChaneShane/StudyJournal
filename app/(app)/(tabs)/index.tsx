import Logo from "@/components/Logo";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { AppColors } from "@/constants/theme";
import { formatUppercaseDate, getTimeOfDayGreeting } from "@/lib/utils/date";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import {
  useSafeAreaInsets
} from "react-native-safe-area-context";
import {
  Card,
  H1,
  ScrollView,
  Text,
  View,
  XStack,
  YStack
} from "tamagui";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Format current date and get greeting using utilities
  const now = new Date();
  const formattedDate = formatUppercaseDate(now);
  const greeting = getTimeOfDayGreeting();
  const userName = "Test";

  // if (!isLoaded) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <Spinner size="large" />
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <View style={styles.container}>
      <ScrollView
        px="$4"
        style={{
          ...styles.content,
          paddingTop: insets.top,
        }}
      >
        {/* Header with date */}
        <YStack gap="$2" style={{ alignItems: "center" }} mt="$4">
          <Logo />
          <Text
            fontSize="$2"
            color="$color10"
            textTransform="uppercase"
            fontWeight="500"
          >
            {formattedDate}
          </Text>
        </YStack>

        {/* Greeting */}
        <YStack gap="$2" style={{ alignItems: "center" }} mb="$4">
          <H1
            fontSize="$8"
            fontWeight="600"
            style={{ textAlign: "center" }}
            color="$color12"
          >
            {greeting}, {userName}!
          </H1>
        </YStack>

        {/* Weekly Calendar Strip */}
        <XStack style={{ justifyContent: "space-between" }} mb="$6">
          {Array.from({ length: 7 }, (_, i) => {
            // Calculate date for this day of the week
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + i);

            const dayData = {
              dayName: startOfWeek.toLocaleDateString("en-US", {
                weekday: "short",
              }),
              dayNumber: startOfWeek.getDate(),
              isToday: startOfWeek.toDateString() === now.toDateString(),
            };

            return (
              <YStack key={i} gap="$1" style={{ alignItems: "center" }}>
                <Text fontSize="$2" color="$color10" fontWeight="500">
                  {dayData.dayName}
                </Text>
                <View
                  style={[
                    styles.dayCircle,
                    dayData.isToday && styles.todayCircle,
                  ]}
                >
                  <Text
                    fontSize="$3"
                    color={dayData.isToday ? "white" : "$color11"}
                    fontWeight={dayData.isToday ? "600" : "400"}
                  >
                    {dayData.dayNumber}
                  </Text>
                </View>
              </YStack>
            );
          })}
        </XStack>

        {/* Action Buttons */}
        <YStack gap="$3" mb="$6">
          {/* Add New Entry Button */}
          <Pressable
            onPress={() => router.push("/new-entry")}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Card
              elevate
              size="$4"
              bordered
              bg="$purple9"
              borderColor="$purple9"
              padding="$4"
            >
              <XStack
                gap="$3"
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <IconSymbol
                  size={24}
                  name="plus.circle.fill"
                  color={AppColors.white}
                />
                <Text fontSize="$5" fontWeight="600" color="white">
                  Add New Entry
                </Text>
              </XStack>
            </Card>
          </Pressable>

          {/* View Previous Entries Button */}
          <Pressable
            onPress={() =>
              {

                // router.push("/(app)/(tabs)/entries")
              } 
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Card
              elevate
              size="$4"
              bordered
              bg="white"
              borderColor="$borderColor"
              padding="$4"
            >
              <XStack
                gap="$3"
                style={{ alignItems: "center", justifyContent: "center" }}
              >
                <IconSymbol
                  size={24}
                  name="book.fill"
                  color={AppColors.primary}
                />
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
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppColors.gray500,
    justifyContent: "center",
    alignItems: "center",
  },
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
  moodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  quoteContainer: {
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 1,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
