export type SubjectRow = {
    id: string;
    created_at: string;
    user_id: string;
    name: string;
    is_active: boolean;
    sort_order: number | null;
    color: string;
};

export type SubjectAverageRow = {
    subjectId: string;
    avg: number;   // 1..5
    count: number; // number of entries included
};