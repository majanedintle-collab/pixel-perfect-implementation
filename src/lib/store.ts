import { useEffect, useState } from "react";

export type ActivityKind = "plan" | "research" | "chat" | "save";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  at: number;
}

export interface AppState {
  tasksPlanned: number;
  researchSessions: number;
  conversations: number;
  activity: ActivityItem[];
  savedNotes: { id: string; title: string; body: string; at: number }[];
}

const KEY = "awpa.state.v1";

const SEED_ACTIVITY: ActivityItem[] = [
  { id: "s1", kind: "plan", title: "Generated a weekly plan for the Q3 reporting handover", at: 1 },
  { id: "s2", kind: "research", title: "Summarized “Async-first teams and meeting load”", at: 2 },
  { id: "s3", kind: "chat", title: "Asked AI how to prioritize a two-deadline week", at: 3 },
  { id: "s4", kind: "save", title: "Saved “Client onboarding research brief” locally", at: 4 },
  { id: "s5", kind: "plan", title: "Generated a daily plan with 4 tasks and 2 breaks", at: 5 },
];

const DEFAULT_STATE: AppState = {
  tasksPlanned: 12,
  researchSessions: 5,
  conversations: 8,
  activity: SEED_ACTIVITY,
  savedNotes: [],
};

let state: AppState = DEFAULT_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

export function updateState(patch: (s: AppState) => AppState) {
  state = patch(state);
  emit();
}

export function logActivity(kind: ActivityKind, title: string) {
  updateState((s) => ({
    ...s,
    activity: [{ id: Math.random().toString(36).slice(2), kind, title, at: Date.now() }, ...s.activity].slice(
      0,
      12,
    ),
  }));
}

export function bumpStat(key: "tasksPlanned" | "researchSessions" | "conversations", by = 1) {
  updateState((s) => ({ ...s, [key]: s[key] + by }));
}

export function saveNote(title: string, body: string) {
  updateState((s) => ({
    ...s,
    savedNotes: [
      { id: Math.random().toString(36).slice(2), title, body, at: Date.now() },
      ...s.savedNotes,
    ].slice(0, 30),
  }));
}

export function clearLocalData() {
  state = DEFAULT_STATE;
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

/** Client-side state hook; returns defaults during SSR to avoid hydration mismatch. */
export function useAppState(): AppState {
  const [snapshot, setSnapshot] = useState<AppState>(DEFAULT_STATE);

  useEffect(() => {
    hydrate();
    setSnapshot(state);
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return snapshot;
}
