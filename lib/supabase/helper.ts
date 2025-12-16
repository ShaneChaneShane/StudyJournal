export function assertOk<T>(
    res: { data: T | null; error: any },
    msg: string
): T {
    if (res.error) {
        throw new Error(`${msg}: ${res.error.message ?? res.error}`);
    }
    if (res.data == null) {
        throw new Error(`${msg}: data is null`);
    }
    return res.data;
}

export function uniq(arr: string[]) {
    return Array.from(new Set(arr));
}

export function dayKeyLocal(d: Date) {
    // local-device day key (for streak/calendar)
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

export function clampProductivity(p: number) {
    if (!Number.isFinite(p)) return 3;
    return Math.min(5, Math.max(1, Math.round(p)));
}
