import { SignOutButton } from "@/components/SignOutButton";
import { AppColors } from "@/constants/theme";
import { getUserDisplayName } from "@/lib/utils/user";
import { useUser } from "@clerk/clerk-expo";
import { Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Card,
  H2,
  ScrollView,
  Spinner,
  Text,
  View,
  YStack
} from "tamagui";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const insets = useSafeAreaInsets();
  const displayName = getUserDisplayName(user);

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Spinner size="large" />
        </View>
      </View>
    );
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
            bg="$white1"
            borderColor="$borderColor"
            padding="$6"
          >
            <YStack gap="$3" style={{ alignItems: "center" }}>
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
                <Image
                  source={{ uri: user?.imageUrl }}
                  style={styles.profileImage}
                />
              </View>

              {/* Name & Email */}
              <YStack style={{ alignItems: "center" }} gap="$2">
                <Text
                  fontSize={23}
                  fontWeight="700"
                  style={{ textAlign: "center" }}
                >
                  {displayName}
                </Text>
                {user?.primaryEmailAddress?.emailAddress && (
                  <Text fontSize={14} color="$color10">
                    {user.primaryEmailAddress.emailAddress}
                  </Text>
                )}
              </YStack>
            </YStack>
          </Card>

          {/* Account Section */}
          <Card
            elevate
            size="$4"
            bordered
            bg="$white1"
            borderColor="$borderColor"
            padding="$5"
          >
            <YStack gap="$2">
              <YStack gap="$1">
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
