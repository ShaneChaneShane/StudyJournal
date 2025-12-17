import { AppColors } from "@/constants/theme";

export const PRODUCTIVITY_OPTIONS = [
  {
    icon: "psychology",
    label: "Very Focused",
    value: 5,
    color: AppColors.productivityVeryFocused
  },
  {
    icon: "insights",
    label: "Focused",
    value: 4,
    color: AppColors.productivityFocused,
  },
  {
    icon: "horizontal-rule",
    label: "Okay",
    value: 3,
    color: AppColors.productivityOkay,
  },
  {
    icon: "trending-flat",
    label: "Low",
    value: 2,
    color: AppColors.productivityLow,
  },
  {
    icon: "trending-down",
    label: "Very Low",
    value: 1,
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

export const getProductivityConfig = (value: number) => {
  return PRODUCTIVITY_CONFIG[value] || PRODUCTIVITY_CONFIG[3];
};