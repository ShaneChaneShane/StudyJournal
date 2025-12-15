export type Subject = {
  id: string;
  title: string;
  color: string;
  isActive: boolean;
};

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: "math", title: "Math", color: "#6366f1", isActive: true },
  { id: "chem", title: "Chemistry", color: "#22c55e", isActive: true },
  { id: "physics", title: "Physics", color: "#f97316", isActive: true },
  { id: "cs", title: "Computer Science", color: "#06b6d4", isActive: true },
  { id: "other", title: "Other", color: "#6b7280", isActive: true },
];

export function getSubjectById(subjectId: string) {
  return DEFAULT_SUBJECTS.find((s) => s.id === subjectId) ?? null;
}
