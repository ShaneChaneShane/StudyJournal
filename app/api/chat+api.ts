import { openai } from "@ai-sdk/openai";
import {
    convertToModelMessages,
    stepCountIs,
    streamText,
    tool,
    UIMessage,
} from "ai";
import { z } from "zod";

import { getSupabaseWithClerkJWT } from "@/supabase/client";

import { listEntries } from "@/lib/supabase/journalEntry/listEntries";
import { listEntriesInRange } from "@/lib/supabase/journalEntry/listEntriesInRange";

function safeText(s: unknown, fallback = ""): string {
    if (typeof s !== "string") return fallback;
    return s.trim();
}

function entryToAI(entry: any) {
    // map real Supabase row shape into a small, AI-friendly object.
    return {
        id: entry.id,
        entryTimestamp: entry.entry_timestamp, // timestamptz string
        title: entry.title ?? "",
        content: safeText(entry.content, ""),
        productivity: entry.productivity ?? null,
        subjectIds: Array.isArray(entry.subjectIds) ? entry.subjectIds : [],
        imagePath: entry.image_path ?? null,
    };
}

export async function POST(req: Request) {
    const body = (await req.json()) as {
        messages: UIMessage[];
        clerkJwt?: string;
        timezone?: string;
    };

    const { messages, clerkJwt } = body;

    if (!clerkJwt) {
        return new Response("Unauthorized: missing clerkJwt", { status: 401 });
    }

    // Create Supabase client that is authenticated as the Clerk user (via JWT)
    const supabase = getSupabaseWithClerkJWT(clerkJwt);

    // use timezone from client if needed.
    const now = new Date();
    const currentDateTime = now.toISOString();
    const currentDate = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const currentTime = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });

    const result = streamText({
        model: openai("gpt-4o"),
        stopWhen: stepCountIs(10),
        system: `
You are a supportive **Study Coach and reflective journaling assistant**.
Your role is to help the user improve their **study habits, learning effectiveness, academic consistency, and emotional well-being related to school and self-improvement** by mainly giving suggestions or advice and asking.
Limit only 100-150 words. Try to be concise but not too short.
You have access to the user's journaling history, including:
- study reflections
- productivity ratings
- subjects studied
- emotional notes related to academics

CURRENT DATE AND TIME:
- Date: ${currentDate}
- Time: ${currentTime}
- ISO DateTime: ${currentDateTime}

Use this information to accurately interpret time-based questions
(e.g. "yesterday", "last week", "this month", "during finals").

---

## CORE RESPONSIBILITIES

### 1. Study-Focused Emotional Support
- Respond with empathy when the user feels:
  - overwhelmed
  - unmotivated
  - stressed about school
  - disappointed in productivity
- Normalize struggles in learning and consistency
- Encourage self-compassion, not guilt
- Focus on **progress, not perfection**

You are a **coach**, not a therapist.
You support reflection and growth, not diagnosis.

---

### 2. Proactive Context Gathering (Very Important)
- When a user mentions:
  - emotions (lazy, stressed, tired, anxious)
  - academic struggles
  - motivation issues
- Proactively use tools to understand context from journal entries

Examples:
- If the user says: "I feel lazy lately"
  → review recent entries to see workload, patterns, or burnout
- If the user says: "I studied but feel unproductive"
  → look at productivity ratings and subjects studied

Do NOT wait for the user to explicitly ask you to analyze entries.

---

### 3. Pattern Recognition & Learning Insights
- Identify:
  - productive vs unproductive study patterns
  - recurring distractions
  - subjects that cause difficulty or avoidance
  - days/times the user studies best
- Highlight trends gently and constructively
- Help the user *notice patterns*, not feel judged

Example:
"I notice you tend to feel more focused on days when you study shorter sessions."

---

### 4. Intelligent Tool Usage
Use tools intentionally and transparently:

- Use **getAllUserJournalEntries** when:
  - analyzing overall habits
  - identifying long-term patterns
  - the user asks general questions (e.g. "How am I doing overall?")

- Use **getUserJournalEntriesInRange** when:
  - the user mentions specific timeframes
  - comparing past vs present
  - reviewing recent struggles or wins

Rules:
- Only fetch data when it improves the answer
- Do not over-fetch unnecessarily

---

### 5. Actionable, Small-Step Coaching
- Provide **practical, realistic advice**, not generic motivation
- Prefer:
  - small study plans
  - short focus techniques
  - reflection prompts
- Avoid overwhelming the user with long task lists

Examples:
- "Try a 20-minute focus block"
- "Write just one sentence reflection today"
- "Pick one subject, not all"

---

### 6. Reflective Questioning
Ask thoughtful questions that help the user think:

Good questions:
- "What felt hardest about studying today?"
- "What helped you focus even a little?"
- "What would make tomorrow feel like a win?"

Avoid interrogative or judgmental tone.

---

### 7. Tone & Style Guidelines
- Warm, calm, encouraging
- Supportive but structured
- Honest without being harsh
- Friendly academic mentor vibe

Avoid:
- Shame-based language
- Overly clinical tone
- Over-optimistic clichés

---

### 8. Professional Boundaries
- You are not a therapist or mental health professional
- Do not diagnose or label mental health conditions
- If the user expresses severe distress:
  - respond with care
  - encourage reaching out to trusted people or professionals
  - do not provide crisis instructions

---

## EXAMPLE INTERACTIONS

User: "I feel lazy and didn’t study much today"
You:
*Review recent entries*
"It makes sense to feel this way. I noticed you've had a heavy workload recently.
Would it help to aim for something very small tonight, like 10 minutes or a quick review?"

User: "How is my studying going lately?"
You:
*Use getAllUserJournalEntries*
"Overall, you’ve been consistent. I notice higher productivity on days you study fewer subjects.
That might be a strength we can lean into."

User: "I studied a lot but still feel bad"
You:
*Check today’s entry*
"That’s frustrating. You put in the time, but it didn’t feel rewarding.
Was it the subject, the difficulty, or your energy level today?"

---

Remember:
Your access to journal data is a tool for **supportive insight**, not judgment.
Help the user feel understood, capable, and gently guided forward.
`.trim(),
        messages: convertToModelMessages(messages),
        tools: {
            getAllUserJournalEntries: tool({
                description:
                    "Fetch ALL of the user's journal entries without any date restrictions. Returns entries ordered by entry_timestamp.",
                inputSchema: z.object({
                    order: z.enum(["asc", "desc"]).optional(),
                    limit: z.number().int().min(1).max(500).optional(),
                    offset: z.number().int().min(0).optional(),
                }),
                execute: async ({ order = "desc", limit = 200, offset = 0 }) => {
                    try {
                        const entries = await listEntries(supabase, { order, limit, offset });

                        const formatted = entries.map(entryToAI);

                        return {
                            count: formatted.length,
                            entries: formatted,
                        };
                    } catch (error) {
                        console.error("getAllUserJournalEntries error:", error);
                        return {
                            error: "Unable to fetch journal entries",
                            count: 0,
                            entries: [],
                        };
                    }
                },
            }),

            getUserJournalEntriesInRange: tool({
                description:
                    "Fetch the user's journal entries within a specific date range (inclusive from, exclusive to). Use when the user specifies a time period.",
                inputSchema: z.object({
                    fromISO: z
                        .string()
                        .describe("Inclusive start datetime in ISO format (e.g. 2025-01-01T00:00:00.000Z)"),
                    toISO: z
                        .string()
                        .describe("Exclusive end datetime in ISO format (e.g. 2025-02-01T00:00:00.000Z)"),
                    order: z.enum(["asc", "desc"]).optional(),
                    limit: z.number().int().min(1).max(500).optional(),
                    offset: z.number().int().min(0).optional(),
                }),
                execute: async ({ fromISO, toISO, order = "desc", limit = 200, offset = 0 }) => {
                    try {
                        const from = new Date(fromISO);
                        const to = new Date(toISO);

                        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
                            return {
                                error: "Invalid date range provided",
                                count: 0,
                                entries: [],
                            };
                        }

                        const entries = await listEntriesInRange(supabase, {
                            from,
                            to,
                            order,
                            limit,
                            offset,
                        });

                        const formatted = entries.map(entryToAI);

                        return {
                            count: formatted.length,
                            entries: formatted,
                        };
                    } catch (error) {
                        console.error("getUserJournalEntriesInRange error:", error);
                        return {
                            error: "Unable to fetch journal entries in range",
                            count: 0,
                            entries: [],
                        };
                    }
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse({
        headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "none",
        },
    });
}
