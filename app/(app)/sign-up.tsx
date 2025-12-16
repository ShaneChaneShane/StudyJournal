import Logo from "@/components/Logo";
import { AppColors } from "@/constants/theme";
import { useModal } from "@/contexts/ModalContext";
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import {
  Keyboard,
  KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback,
} from "react-native";
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


export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { showModal } = useModal();

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));

      showModal({
        type: "alert",
        title: "Whoops",
        description: "Whoops an error occurred, please try again!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setIsLoading(true);

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));

      showModal({
        type: "alert",
        title: "Whoops",
        description: "Whoops an error occurred, please try again!",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
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
                Verify Your Email
              </Text>
              <Paragraph
                color="$color"
                opacity={0.7}
                style={{ textAlign: "center" }}
              >
                {`We've sent a verification code to\n${emailAddress}`}
              </Paragraph>
            </YStack>

            <Card elevate padding="$4" gap="$2" backgroundColor="$background">
              <YStack gap="$2">
                <YStack gap="$2">
                  <Label color="$color">Verification Code</Label>
                  <Input
                    value={code}
                    placeholder="Enter verification code"
                    onChangeText={setCode}
                    borderColor="$borderColor"
                    focusStyle={{
                      borderColor: "$orange10",
                    }}
                    keyboardType="numeric"
                    autoComplete="one-time-code"
                  />
                </YStack>

                <Spacer />

                <Button
                  size="$4"
                  bg="$orange7"
                  color="white"
                  borderColor="$orange7"
                  onPress={onVerifyPress}
                  disabled={!isLoaded || isLoading}
                  opacity={!isLoaded || isLoading ? 0.5 : 1}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Button>
              </YStack>
            </Card>

            <XStack
              gap="$2"
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <Paragraph color="$color" opacity={0.7}>
                {"Didn't receive the code?"}
              </Paragraph>
              <Button
                variant="outlined"
                size="$3"
                borderColor="$orange8"
                color="$orange8"
                onPress={() => setPendingVerification(false)}
              >
                Resend
              </Button>
            </XStack>
          </YStack>
        </ScrollView>
      </KeyboardScreen>
    );
  }

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
          <Logo />

          <YStack gap="$2" style={{ alignItems: "center" }}>
            <Text fontWeight={500} color={AppColors.primaryDark} style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
              Start your new journal here!
            </Text>
            <Paragraph
              color="$color"
              opacity={0.7}
              style={{ textAlign: "center" }}
            >
              Sign up to get started with your account
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
                    placeholder="Create a password"
                    onChangeText={setPassword}
                    borderColor="$borderColor"
                    paddingEnd={44} // space for the eye icon
                    focusStyle={{
                      borderColor: "$orange10",
                    }}
                  />

                  <Button
                    position="absolute"
                    style={{ right: 8, top: "20%" }}
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
              </YStack>

              <Spacer />

              <Button
                size="$4"
                bg="$orange7"
                color="white"
                borderColor="$orange7"
                onPress={onSignUpPress}
                disabled={!isLoaded || isLoading}
                opacity={!isLoaded || isLoading ? 0.5 : 1}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </YStack>
          </Card>

          <XStack
            gap="$2"
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <Paragraph color="$color" opacity={0.7}>
              Already have an account?
            </Paragraph>

            <Button
              variant="outlined"
              size="$3"
              borderColor="$orange8"
              color="$orange8"
              onPress={() => router.canGoBack() && router.back()}
            >
              Sign In
            </Button>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardScreen>
  );
}
