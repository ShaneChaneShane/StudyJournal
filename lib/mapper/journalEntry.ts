import { JournalEntry } from "@/lib/model/journalEntry";
import { JournalEntryRow } from "@/supabase/types/journalEntry";

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
