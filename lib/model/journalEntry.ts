export type JournalEntry = {
    id: string;
    createdAt: string;
    updatedAt: string;
    entryTimestamp: string; // timestamptz
    title: string | null;
    content: string;
    productivity: number; // 1..5
    imagePath: string | null;
};

export type EntryWithSubjects = JournalEntry & {
    subjectIds: string[];
};

export type CalendarDaySummary = {
    dateKey: string;       // YYYY-MM-DD local
    entryCount: number;
    avgProductivity: number; // 1..5
};