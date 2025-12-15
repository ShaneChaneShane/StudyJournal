import { AppColors } from "@/constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
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

type ChatRole = "user" | "assistant";

type ChatPart =
  | { type: "text"; text: string }
  | { type: "tool-getUserJournalEntries" }
  | { type: "tool-getAllUserJournalEntries" };

type ChatMessage = {
  id: string;
  role: ChatRole;
  parts: ChatPart[];
  createdAt: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function mockAssistantReply(userText: string): ChatPart[] {
  const t = userText.toLowerCase();

  // A couple “tool-like” moments to show how it would look
  if (t.includes("summary") || t.includes("summarize")) {
    return [
      { type: "tool-getUserJournalEntries" },
      {
        type: "text",
        text:
          "**Today’s summary (mock):**\n" +
          "- You studied **Math** and **CS**\n" +
          "- Productivity: **Focused**\n" +
          "- Win: finished a tricky topic\n\n" +
          "**Tomorrow (light plan):**\n" +
          "1. Do 20 minutes of review\n" +
          "2. One small practice set\n" +
          "3. Write 2–3 lines reflection",
      },
    ];
  }

  if (t.includes("streak")) {
    return [
      { type: "tool-getAllUserJournalEntries" },
      {
        type: "text",
        text:
          "Nice — about streaks:\n" +
          "- The goal is consistency, not perfection.\n" +
          "- If you miss a day, restart without guilt.\n\n" +
          "**Tip:** make your entry super small on busy days (2–3 lines).",
      },
    ];
  }

  if (t.includes("lazy") || t.includes("procrast")) {
    return [
      {
        type: "text",
        text:
          "If today felt unproductive, try this (quick):\n" +
          "- **2-minute start**: open notes + write one line\n" +
          "- **25/5**: 25 min focus, 5 min break\n" +
          "- Remove 1 distraction (phone out of reach)\n\n" +
          "Want a plan for **one subject** you struggled with today?",
      },
    ];
  }

  // Default generic “study coach” response
  return [
    {
      type: "text",
      text:
        "Got it. Here’s a simple reflection prompt:\n" +
        "1) What did you study?\n" +
        "2) What was hard?\n" +
        "3) What’s one improvement for tomorrow?\n\n" +
        "If you tell me your productivity rating (Very Low → Very Focused), I’ll tailor advice.",
    },
  ];
}

export default function AIChatScreen() {
  const [input, setInput] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Mock initial assistant message (optional)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      role: "assistant",
      createdAt: Date.now(),
      parts: [
        {
          type: "text",
          text:
            "Hi! I’m your **Study Coach** (mock).\n\n" +
            "Try asking:\n" +
            "- “Summarize today”\n" +
            "- “I feel lazy, help”\n" +
            "- “How do I keep my streak?”",
        },
      ],
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      createdAt: Date.now(),
      parts: [{ type: "text", text }],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    scrollToBottom();

    // Mock assistant response after a short delay
    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: "assistant",
        createdAt: Date.now(),
        parts: mockAssistantReply(text),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      scrollToBottom();
    }, 450);
  };

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
                    <MaterialIcons name="smart-toy" size={40} color="#666" />
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
                    m.role === "user"
                      ? styles.userMessage
                      : styles.assistantMessage,
                  ]}
                >
                  {m.role === "assistant" && (
                    <View style={styles.messageAvatar}>
                      <MaterialIcons name="smart-toy" size={20} color="#666" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      m.role === "user"
                        ? styles.userBubble
                        : styles.assistantBubble,
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
                                Reviewing all entries (mock)...
                              </Text>
                            </View>
                          );

                        case "tool-getUserJournalEntries":
                          return (
                            <View key={`${m.id}-${i}`} style={styles.toolInvocation}>
                              <MaterialIcons name="search" size={14} color="#666" />
                              <Text fontSize="$2" color="$color9" ml="$2">
                                Looking through entries (mock)...
                              </Text>
                            </View>
                          );

                        default:
                          return null;
                      }
                    })}
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={input}
                onChange={(e) => setInput(e.nativeEvent.text)}
                onSubmitEditing={handleSend}
                onKeyPress={(e) => {
                  // CMD+Enter (Mac) or Ctrl+Enter (Windows/Linux) to send
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
              />
              <Button
                size="$3"
                bg={input.trim() ? "#904BFF" : "#cccccc"}
                color="white"
                onPress={handleSend}
                disabled={!input.trim()}
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
