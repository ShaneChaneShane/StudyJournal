import { EntryWithSubjects, JournalEntry } from "@/lib/model/journalEntry";
import { EntryWithSubjectsRow, JournalEntryRow } from "@/supabase/types/journalEntry";

export function mapJournalEntry(row: JournalEntryRow): JournalEntry {
    return {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        entryTimestamp: row.entry_timestamp,
        title: row.title,
        imagePath: row.image_path,
        productivity: row.productivity,
        updatedAt: row.updated_at,
    };
}

export function mapEntryWithSubject(row: EntryWithSubjectsRow): EntryWithSubjects {
    return {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        entryTimestamp: row.entry_timestamp,
        title: row.title,
        imagePath: row.image_path,
        productivity: row.productivity,
        updatedAt: row.updated_at,
        subjectIds: row.subjectIds
    };
}
