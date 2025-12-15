type MonthlySubjectAverage = {
  subjectId: string;
  avg: number | null; // null = no logs this month
  count: number;      // number of logs
};

export function useMonthlySubjectAverages() {
  // TODO: replace with real computation from DB later
  const data: MonthlySubjectAverage[] = [
    { subjectId: "math", avg: 4.2, count: 8 },
    { subjectId: "cs", avg: 3.4, count: 5 },
    { subjectId: "physics", avg: 2.1, count: 3 },
    { subjectId: "chem", avg: null, count: 0 },  // no logs -> grayed out
    { subjectId: "other", avg: 3.0, count: 1 },
  ];

  return { data };
}
