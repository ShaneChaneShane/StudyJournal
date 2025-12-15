import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState, type ComponentProps } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as ImagePicker from "expo-image-picker";

import { PRODUCTIVITY_OPTIONS } from "@/lib/constants/productivity";
import { DEFAULT_SUBJECTS } from "@/lib/constants/subjects";

type NewEntryDraft = {
  title?: string;
  content: string;
  productivity: string;
  subjectIds: string[];
  images: { uri: string; caption?: string; alt?: string }[]; // keep array, but we store max 1
  userId: string;
};

export default function NewEntryScreen() {
  const params = useLocalSearchParams();
  const { promptTitle, promptText } = params;

  const initial = useMemo(() => {
    const title = typeof promptTitle === "string" ? promptTitle : "";
    const content = typeof promptText === "string" ? promptText : "";
    return { title, content, productivity: "okay" };
  }, [promptTitle, promptText]);

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [productivity, setProductivity] = useState(initial.productivity);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null); // NEW
  const [saving, setSaving] = useState(false);

  const toggleSubject = (id: string) => {
    setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // NEW: pick one image from gallery
  const pickImage = async () => {
    // Ask permission
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to add an image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.canceled) return;

    const uri = result.assets?.[0]?.uri;
    if (uri) setImageUri(uri);
  };

  const removeImage = () => setImageUri(null);

  const handleSave = async (entry: NewEntryDraft) => {
    try {
      setSaving(true);

      // await createJournalEntry(entry);
      console.log("SAVE ENTRY PAYLOAD", entry);

      Alert.alert("Saved (mock)", "Entry payload logged to console.");
      router.back();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
      Alert.alert("Error", "Failed to save your journal entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert("Discard Entry?", "Are you sure you want to discard this entry?", [
      { text: "Keep Writing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  const onPressSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      Alert.alert("Missing content", "Please write something before saving.");
      return;
    }

    if (subjectIds.length === 0) {
      Alert.alert("No subject selected", "Select at least 1 subject (or choose Other).");
      return;
    }

    const payload: NewEntryDraft = {
      title: title.trim() || undefined,
      content: trimmedContent,
      productivity,
      subjectIds,
      images: imageUri ? [{ uri: imageUri }] : [], // NEW
      userId: "",
    };

    handleSave(payload);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>New Entry</Text>

          <TouchableOpacity onPress={onPressSave} style={[styles.headerBtn, saving && { opacity: 0.6 }]} disabled={saving}>
            <Text style={styles.headerBtnText}>{saving ? "Saving..." : "Save"}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={styles.sectionLabel}>Title (optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Calculus practice"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            returnKeyType="next"
          />

          {/* Productivity */}
          <Text style={styles.sectionLabel}>Productivity</Text>
          <View style={styles.productivityRow}>
            {PRODUCTIVITY_OPTIONS.map((opt) => {
              const selected = opt.value === productivity;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setProductivity(opt.value)}
                  style={[
                    styles.productivityChip,
                    selected && { borderColor: opt.color, backgroundColor: "#f9fafb" },
                  ]}
                >
                  <MaterialIcons
                    size={18}
                    name={opt.icon as ComponentProps<typeof MaterialIcons>["name"]}
                    color={opt.color}
                  />
                  <Text style={styles.productivityText}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Subjects */}
          <Text style={styles.sectionLabel}>Subjects</Text>
          <Text style={styles.helperText}>Tap to select multiple</Text>

          <View style={styles.subjectsWrap}>
            {DEFAULT_SUBJECTS.filter((s) => s.isActive).map((s) => {
              const selected = subjectIds.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => toggleSubject(s.id)}
                  style={[
                    styles.subjectChip,
                    selected
                      ? { backgroundColor: s.color, borderColor: s.color }
                      : { borderColor: "#e5e7eb" },
                  ]}
                >
                  <Text style={[styles.subjectChipText, selected ? { color: "#fff" } : { color: "#111827" }]}>
                    {s.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Image */}
          <Text style={styles.sectionLabel}>Image (optional)</Text>
          <View style={styles.imageRow}>
            {!imageUri ? (
              <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                <MaterialIcons size={18} name="image" color="#111827" />
                <Text style={styles.imageButtonText}>Add Image</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={removeImage} style={styles.removeImageBtn}>
                  <MaterialIcons size={18} name="close" color="#111827" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Content */}
          <Text style={styles.sectionLabel}>What did you study today?</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Write your reflection… What did you learn? What was hard? What will you do tomorrow?"
            placeholderTextColor="#9ca3af"
            style={styles.textArea}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity onPress={onPressSave} style={[styles.primaryBtn, saving && { opacity: 0.7 }]} disabled={saving}>
            <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Save Entry"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerBtn: { paddingVertical: 8, paddingHorizontal: 10 },
  headerBtnText: { fontSize: 14, fontWeight: "700", color: "#111827" },

  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 10 },
  sectionLabel: { marginTop: 10, fontSize: 13, fontWeight: "700", color: "#111827" },
  helperText: { marginTop: -6, fontSize: 12, color: "#6b7280" },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  productivityRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  productivityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  productivityText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  subjectsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  subjectChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#ffffff" },
  subjectChipText: { fontSize: 12, fontWeight: "700" },

  // NEW image styles
  imageRow: { marginTop: 4 },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  imageButtonText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  imagePreviewContainer: {
    position: "relative",
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  imagePreview: { width: "100%", height: "100%" },
  removeImageBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 180,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#ffffff",
    lineHeight: 22,
  },

  primaryBtn: { marginTop: 10, borderRadius: 14, paddingVertical: 14, alignItems: "center", backgroundColor: "#111827" },
  primaryBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 14 },
});
