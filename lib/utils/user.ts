import type { UserResource } from "@clerk/types";

/**
 * Get user's display name with fallback chain
 * Priority: Full Name > First Name > Username > "User"
 */
export const getUserDisplayName = (
  user: UserResource | null | undefined
): string => {
  if (!user) return "User";

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user.username || "User";
};

/**
 * Get user's first name or friendly fallback
 * Priority: First Name > Username > "there"
 */
export const getUserFirstName = (
  user: UserResource | null | undefined
): string => {
  if (!user) return "";
  return user.firstName ?? user.username ?? "";
};
