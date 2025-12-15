import { AppColors } from "@/constants/theme";
import { NotebookPen } from "@tamagui/lucide-icons";
import React from "react";

import { Text, XStack, YStack } from "tamagui";

export default function Logo({ hasText = false }: { hasText?: boolean }) {
  return (
    <YStack gap="$3" style={{ alignItems: "center" }} mb="$4">
      <XStack
        bg={AppColors.primaryDark}
        p="$3"
        style={{
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
        }}
      >
        <NotebookPen size={32} color="white" />
      </XStack>
      {hasText && (
        <Text fontSize="$7" fontWeight="700" color="$color">
          Study Journal
        </Text>
      )}
    </YStack>
  );
}
