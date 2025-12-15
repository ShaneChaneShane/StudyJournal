import { AppColors } from "@/constants/theme";

export const PRODUCTIVITY_OPTIONS = [
  {
    icon: "psychology",
    label: "Very Focused",
    value: "very-focused",
    color: AppColors.productivityVeryFocused,
  },
  {
    icon: "insights",
    label: "Focused",
    value: "focused",
    color: AppColors.productivityFocused,
  },
  {
    icon: "horizontal-rule",
    label: "Okay",
    value: "okay",
    color: AppColors.productivityOkay,
  },
  {
    icon: "trending-flat",
    label: "Low",
    value: "low",
    color: AppColors.productivityLow,
  },
  {
    icon: "trending-down",
    label: "Very Low",
    value: "very-low",
    color: AppColors.productivityVeryLow,
  },
] as const;

// Create a lookup map for quick access by value
export const PRODUCTIVITY_CONFIG = PRODUCTIVITY_OPTIONS.reduce(
  (acc, item) => {
    acc[item.value] = item;
    return acc;
  },
  {} as Record<string, (typeof PRODUCTIVITY_OPTIONS)[number]>
);

export const getProductivityConfig = (value: string) => {
  return PRODUCTIVITY_CONFIG[value] || PRODUCTIVITY_CONFIG.okay;
};