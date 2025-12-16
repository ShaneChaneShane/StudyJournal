export type Subject = {
    id: string;
    name: string;
    color: string;
    isActive: boolean;
    sortOrder: number;
};

export type SubjectAverage = {
    subjectId: string;
    avg: number;   // 1..5
    count: number; // number of entries included
};