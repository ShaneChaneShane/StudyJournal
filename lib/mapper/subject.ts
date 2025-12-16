import { Subject } from "@/lib/model/subject";
import { SubjectRow } from "@/supabase/types/subject";

export function mapSubject(row: SubjectRow): Subject {
    return {
        id: row.id,
        name: row.name,
        color: row.color,
        isActive: row.is_active,
        sortOrder: row.sort_order ?? 0,
    };
}
