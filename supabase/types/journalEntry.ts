export type JournalEntryRow = {
    id: string;
    created_at: string;
    updated_at: string;
    user_id: string; // Clerk user id stored in your table
    entry_timestamp: string; // timestamptz
    title: string | null;
    content: string;
    productivity: number; // 1..5
    image_path: string | null;
};

export type EntryWithSubjects = JournalEntryRow & {
    subjectIds: string[];
};

export type CalendarDaySummary = {
    dateKey: string;       // YYYY-MM-DD local
    entryCount: number;
    avgProductivity: number; // 1..5
};