import { AppColors } from "@/constants/theme";
import { generateAPIUrl } from "@/utils";
import { useChat } from "@ai-sdk/react";
import { useAuth } from "@clerk/clerk-expo";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { DefaultChatTransport } from "ai";
import { fetch as expoFetch } from "expo/fetch";
import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text, View, YStack } from "tamagui";

export default function AIChatScreen() {
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const { getToken, userId, isSignedIn } = useAuth();

  // Create transport once (but still can call getToken() inside body)
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl("/api/chat"), // <-- your route
      body: async () => {
        const clerkJwt = await getToken({ template: "supabase" });

        return {
          clerkJwt: clerkJwt ?? null,
          // optional: can help debugging, but server should not trust this
          userId: userId ?? null,
        };
      },
    });

  }, [getToken, userId]);

  const { messages, error, sendMessage, status } = useChat({
    transport,
    onError: (e) => console.error("chat error:", e),
  });

  const isLoading = status === "submitted" || status === "streaming";


  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    if (!isSignedIn) {
      // You can show a toast instead if you have one
      console.warn("Not signed in");
      return;
    }

    sendMessage({ text });
    setInput("");
    scrollToBottom();
  };

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <Text color="$red10">{error.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.content}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {messages.length === 0 ? (
              <YStack gap="$4" style={{ alignItems: "center" }} mt="$12">
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <MaterialCommunityIcons name="robot-excited" size={40} color="#666" />
                  </View>
                </View>

                <Text
                  fontSize="$6"
                  fontWeight="600"
                  color="$color11"
                  style={{ textAlign: "center" }}
                >
                  Start a conversation
                </Text>

                <Text
                  fontSize="$4"
                  color="$color9"
                  style={{ textAlign: "center", lineHeight: 22 }}
                  px="$6"
                >
                  Ask about study reflection, productivity, or planning.
                </Text>
              </YStack>
            ) : (
              messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageContainer,
                    m.role === "user" ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  {m.role === "assistant" && (
                    <View style={styles.messageAvatar}>
                      <MaterialCommunityIcons name="robot-excited" size={20} color="#666" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      m.role === "user" ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {m.parts.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          return (
                            <Markdown
                              key={`${m.id}-${i}`}
                              style={{
                                body: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                  fontSize: 16,
                                  lineHeight: 22,
                                },
                                paragraph: {
                                  marginTop: 0,
                                  marginBottom: 0,
                                  color: m.role === "user" ? "white" : "#1f2937",
                                },
                                strong: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                  fontWeight: "bold",
                                },
                                em: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                  fontStyle: "italic",
                                },
                                link: {
                                  color: m.role === "user" ? "#cfe2ff" : "#904BFF",
                                },
                                bullet_list: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                },
                                ordered_list: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                },
                                list_item: {
                                  color: m.role === "user" ? "white" : "#1f2937",
                                },
                              }}
                            >
                              {part.text}
                            </Markdown>
                          );

                        case "tool-getAllUserJournalEntries":
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolInvocation}>
                              <MaterialIcons name="search" size={14} color="#666" />
                              <Text fontSize="$2" color="$color9" ml="$2">
                                Reviewing all entries...
                              </Text>
                            </View>
                          );

                        case "tool-getUserJournalEntriesInRange":
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolInvocation}>
                              <MaterialIcons name="search" size={14} color="#666" />
                              <Text fontSize="$2" color="$color9" ml="$2">
                                Looking through entries in range...
                              </Text>
                            </View>
                          );

                        default:
                          return null;
                      }
                    })}
                    {m.role === "assistant" && isLoading ? (
                      <View style={{ marginTop: 8 }}>
                        <Text fontSize="$2" color="$color9">
                          Thinking...
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={isSignedIn ? "Type a message..." : "Sign in to chat..."}
                placeholderTextColor="#999"
                value={input}
                onChange={(e) => setInput(e.nativeEvent.text)}
                onSubmitEditing={handleSend}
                onKeyPress={(e) => {
                  // CMD+Enter (Mac) or Ctrl+Enter (Windows/Linux) to send (web)
                  const nativeEvent = e.nativeEvent as {
                    key?: string;
                    metaKey?: boolean;
                    ctrlKey?: boolean;
                  };
                  if (
                    nativeEvent.key === "Enter" &&
                    (nativeEvent.metaKey || nativeEvent.ctrlKey)
                  ) {
                    // @ts-ignore preventDefault exists on web
                    e.preventDefault?.();
                    handleSend();
                  }
                }}
                autoFocus={false}
                multiline={Platform.OS === "web"}
                maxLength={1000}
                returnKeyType="send"
                blurOnSubmit={Platform.OS !== "web"}
                editable={!!isSignedIn && !isLoading}
              />

              <Button
                size="$3"
                bg={input.trim() && isSignedIn && !isLoading ? "$orange8" : "#cccccc"}
                color="white"
                onPress={handleSend}
                disabled={!input.trim() || !isSignedIn || isLoading}
                circular
                style={styles.sendButton}
                pressStyle={{ scale: 0.95 }}
              >
                ↑
              </Button>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  keyboardAvoid: { flex: 1 },
  content: { flex: 1 },

  messagesContainer: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexGrow: 1,
  },

  avatarContainer: { alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },

  messageContainer: {
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  userMessage: { justifyContent: "flex-end" },
  assistantMessage: { justifyContent: "flex-start" },

  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: { backgroundColor: AppColors.primaryDark, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: AppColors.gray100, borderBottomLeftRadius: 4 },

  toolInvocation: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginVertical: 4,
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#666",
  },

  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#ffffff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    maxHeight: 100,
    paddingVertical: 8,
    lineHeight: 22,
  },
  sendButton: {
    width: 36,
    height: 36,
    minHeight: 36,
    padding: 0,
    fontSize: 20,
  },
});
