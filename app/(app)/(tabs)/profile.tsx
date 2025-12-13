import { SignOutButton } from "@/components/SignOutButton";
import { AppColors } from "@/constants/theme";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  H1,
  H2,
  ScrollView,
  Text,
  View,
  XStack,
  YStack
} from "tamagui";

export default function Profile() {
  // const { user, isLoaded } = useUser();
  const insets = useSafeAreaInsets();
  // const { currentStreak, longestStreak } = useStreaks();

  // if (!isLoaded) {
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <Spinner size="large" />
  //       </View>
  //     </View>
  //   );
  // }

  const initials = "testINIT";
  // getUserInitials(user);
  const displayName = "nameTEST";
  // getUserDisplayName(user);
  // mock user
  const user = {
    imageUrl: "https://i.pravatar.cc/111",
    primaryEmailAddress: {
      emailAddress: "john.doe@example.com",
    },
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          paddingTop: insets.top + 20,
        }}
      >
        <YStack px="$4" gap="$4" pb={insets.bottom + 100}>
          {/* Profile Header Card */}
          <Card
            elevate
            size="$4"
            bordered
            bg="$background"
            borderColor="$borderColor"
            padding="$6"
          >
            <YStack gap="$4" style={{ alignItems: "center" }}>
              {/* Profile Picture */}
              <View
                style={{
                  borderRadius: 60,
                  overflow: "hidden",
                  width: 120,
                  height: 120,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#e5e7eb",
                }}
              >
                {user?.imageUrl ? (
                  <Image
                    source={{ uri: user.imageUrl }}
                    style={styles.profileImage}
                  />
                ) : (
                  <Text fontSize={42} fontWeight="700" color="$color11">
                    {initials}
                  </Text>
                )}
              </View>

              {/* Name & Email */}
              <YStack style={{ alignItems: "center" }} gap="$2">
                <H1
                  fontSize={28}
                  fontWeight="700"
                  style={{ textAlign: "center" }}
                >
                  {displayName}
                </H1>
                {user?.primaryEmailAddress?.emailAddress && (
                  <Text fontSize={14} color="$color10">
                    {user.primaryEmailAddress.emailAddress}
                  </Text>
                )}
              </YStack>
            </YStack>
          </Card>

          {/* Stats Cards */}
          <XStack gap="$4">
            {/* Current Streak Card */}
            <Card
              elevate
              size="$4"
              bordered
              bg="$background"
              borderColor="$borderColor"
              padding="$5"
              flex={1}
            >
            </Card>

          </XStack>

          {/* Account Section */}
          <Card
            elevate
            size="$4"
            bordered
            bg="$background"
            borderColor="$borderColor"
            padding="$5"
          >
            <YStack gap="$4">
              <YStack gap="$2">
                <H2 fontSize={18} fontWeight="700" color="$color12">
                  Account
                </H2>
                <Text fontSize={13} color="$color10" lineHeight={18}>
                  Manage your account settings
                </Text>
              </YStack>
              <SignOutButton />
            </YStack>
          </Card>
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
  profileImage: {
    width: 120,
    height: 120,
  },
  planBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  proPlanBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(144, 75, 255, 0.4)",
    backgroundColor: "rgba(144, 75, 255, 0.15)",
  },
  streakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bestStreakIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(144, 75, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
