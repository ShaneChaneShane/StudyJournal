import Logo from "@/components/Logo";
import SignInWithGoogle from "@/components/SignInWithGoogle";
import { AppColors } from "@/constants/theme";
import { useModal } from "@/contexts/ModalContext";
import { isClerkAPIResponseError, useSignIn } from "@clerk/clerk-expo";
import { ClerkAPIResponseError } from "@clerk/types";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Input,
  Label,
  Paragraph,
  ScrollView,
  Spacer,
  Text,
  XStack,
  YStack
} from "tamagui";

function KeyboardScreen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {children}
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { showModal } = useModal();

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling for more info on error handling
      const clerkError = isClerkAPIResponseError(err)
        ? (err as ClerkAPIResponseError)
        : null;

      showModal({
        type: "dialog",
        title: "Error",
        description:
          clerkError?.errors[0]?.longMessage ||
          clerkError?.errors[0]?.message ||
          "Whoops an error occurred, please try again!",
        onCancel: () => {
          setIsLoading(false);
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardScreen>
      <ScrollView
        flex={1}
        bg="$background"
        contentContainerStyle={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack
          flex={1}
          p="$4"
          gap="$4"
          style={{ justifyContent: "center", minHeight: "100%" }}
        >
          <Logo hasText={true} />

          <YStack gap="$2" style={{ alignItems: "center" }}>
            <Text fontWeight={500} color={AppColors.primaryDark} style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
              {"Welcome!\nContinue your productivity journal :)"}
            </Text>
            <Paragraph
              color="$color"
              opacity={0.7}
              style={{ textAlign: "center" }}
            >
              Sign in to continue
            </Paragraph>
          </YStack>

          <Card elevate padding="$4" gap="$2" backgroundColor="$white1">
            <YStack gap="$2">
              <YStack gap="$2">
                <Label color="$color">Email Address</Label>
                <Input
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={emailAddress}
                  placeholder="Enter your email"
                  onChangeText={setEmailAddress}
                  borderColor="$borderColor"
                  focusStyle={{
                    borderColor: "$orange10",
                  }}
                />
              </YStack>

              <YStack gap="$2">
                <Label color="$color">Password</Label>

                <YStack position="relative">
                  <Input
                    secureTextEntry={!showPassword}
                    value={password}
                    placeholder="Enter your password"
                    onChangeText={setPassword}
                    borderColor="$borderColor"
                    focusStyle={{
                      borderColor: "$orange10",
                    }}
                  />
                </YStack>

                <Button
                  position="absolute"
                  style={{ right: 8, top: "62%" }}
                  // transform={[{ translateY: -18 }]}
                  size="$2"
                  circular
                  chromeless
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color="#888"
                  />
                </Button>
              </YStack>

              <Spacer size="$2" />

              <Button
                size="$4"
                bg="$orange7"
                color={AppColors.white}
                borderColor="$orange7"
                onPress={onSignInPress}
                disabled={!isLoaded || isLoading}
                opacity={!isLoaded || isLoading ? 0.5 : 1}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <SignInWithGoogle />
            </YStack>
          </Card>

          <XStack
            gap="$2"
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <Paragraph color="$color" opacity={0.7}>
              {"Don't have an account?"}
            </Paragraph>
            <Link href="/sign-up" asChild>
              <Button
                variant="outlined"
                size="$3"
                borderColor="$orange8"
                color="$orange8"
              >
                Sign Up
              </Button>
            </Link>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardScreen>
  );
}
