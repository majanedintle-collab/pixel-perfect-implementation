import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Info, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { OutputCard } from "@/components/OutputCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  PLANNER_PROMPT,
  generateDailyPlan,
  generateWeeklyPlan,
  uid,
  type Priority,
  type ScheduleBlock,
  type TaskInput,
} from "@/lib/ai-sim";
import { bumpStat, logActivity, saveNote } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Enter tasks, deadlines and priorities, then generate an editable daily or weekly productivity schedule.",
      },
      { property: "og:title", content: "AI Task Planner — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Generate an editable daily or weekly schedule from your tasks and deadlines.",
      },
    ],
  }),
  component: Planner,
});

const PRIORITIES: Priority[] = ["Urgent", "High", "Medium", "Low"];

const PRIORITY_STYLES: Record<Priority, string> = {
  Urgent: "bg-primary text-primary-foreground",
  High: "bg-sky text-sky-foreground",
  Medium: "bg-accent text-accent-foreground",
  Low: "bg-muted text-muted-foreground",
};

function emptyTask(): TaskInput {
  return { id: uid(), name: "", deadline: "", priority: "Medium", estimate: "1 hour", notes: "" };
}

function Planner() {
  const [tasks, setTasks] = useState<TaskInput[]>([
    {
      id: uid(),
      name: "Finish Q3 performance summary",
      deadline: "Today, 5:00 PM",
      priority: "Urgent",
      estimate: "2 hours",
      notes: "Needs the updated revenue table from finance.",
    },
    {
      id: uid(),
      name: "Prepare client onboarding deck",
      deadline: "Friday",
      priority: "High",
      estimate: "90 min",
      notes: "",
    },
    {
      id: uid(),
      name: "Clear approvals and inbox backlog",
      deadline: "This week",
      priority: "Low",
      estimate: "45 min",
      notes: "",
    },
  ]);
  const [draft, setDraft] = useState<TaskInput>(emptyTask());
  const [schedule, setSchedule] = useState<ScheduleBlock[] | null>(null);
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [seed, setSeed] = useState(0);

  const addTask = () => {
    if (!draft.name.trim()) {
      toast.error("Give the task a name first");
      return;
    }
    setTasks((t) => [...t, { ...draft, id: uid() }]);
    setDraft(emptyTask());
    toast.success("Task added");
  };

  const build = (next: "daily" | "weekly", nextSeed = seed) => {
    if (tasks.length === 0) {
      toast.error("Add at least one task");
      return;
    }
    setMode(next);
    setSchedule(
      next === "daily" ? generateDailyPlan(tasks, nextSeed) : generateWeeklyPlan(tasks, nextSeed),
    );
    bumpStat("tasksPlanned", tasks.length);
    logActivity(
      "plan",
      `Generated a ${next} plan from ${tasks.length} task${tasks.length === 1 ? "" : "s"}`,
    );
  };

  const updateBlock = (id: string, patch: Partial<ScheduleBlock>) =>
    setSchedule((s) => s?.map((b) => (b.id === id ? { ...b, ...patch } : b)) ?? s);

  const scheduleText = (schedule ?? [])
    .map((b) => `${b.time} — ${b.task} [${b.priority}, ${b.duration}]\n   Why: ${b.reason}`)
    .join("\n");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">AI Task Planner</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Add what's on your plate. The assistant sequences it by urgency and deadline, adds
          realistic breaks, and explains why each item sits where it does.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="surface p-6">
          <h2 className="text-base font-semibold">Add a task</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Task name</Label>
              <Input
                id="name"
                className="mt-1.5"
                placeholder="e.g. Draft the stakeholder update"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                className="mt-1.5"
                placeholder="e.g. Thursday, 12:00"
                value={draft.deadline}
                onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="estimate">Estimated time</Label>
              <Input
                id="estimate"
                className="mt-1.5"
                placeholder="e.g. 90 min or 2 hours"
                value={draft.estimate}
                onChange={(e) => setDraft({ ...draft, estimate: e.target.value })}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={draft.priority}
                onValueChange={(v) => setDraft({ ...draft, priority: v as Priority })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                className="mt-1.5"
                rows={2}
                placeholder="Context, blockers, who's involved…"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" onClick={addTask}>
              <Plus className="size-4" /> Add task
            </Button>
            <Button onClick={() => build("daily")}>
              <CalendarDays className="size-4" /> Generate Daily Plan
            </Button>
            <Button variant="secondary" onClick={() => build("weekly")}>
              Generate Weekly Plan
            </Button>
          </div>
          <p className="mt-4 flex gap-2 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Prompt used: </span>
              {PLANNER_PROMPT}
            </span>
          </p>
        </div>

        <div className="surface p-6">
          <h2 className="text-base font-semibold">Your tasks ({tasks.length})</h2>
          <ul className="mt-4 space-y-3">
            {tasks.map((t) => (
              <li key={t.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{t.name}</p>
                  <button
                    onClick={() => setTasks((list) => list.filter((x) => x.id !== t.id))}
                    aria-label={`Remove ${t.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge className={PRIORITY_STYLES[t.priority]}>{t.priority}</Badge>
                  <span>{t.estimate}</span>
                  {t.deadline ? <span>· {t.deadline}</span> : null}
                </div>
              </li>
            ))}
            {tasks.length === 0 ? (
              <li className="text-sm text-muted-foreground">No tasks yet — add one to begin.</li>
            ) : null}
          </ul>
        </div>
      </section>

      {schedule ? (
        <OutputCard
          title={mode === "daily" ? "Your daily plan" : "Your weekly plan"}
          copyText={scheduleText}
          onRegenerate={() => {
            const next = seed + 1;
            setSeed(next);
            build(mode, next);
          }}
          onSave={() => {
            saveNote(mode === "daily" ? "Daily plan" : "Weekly plan", scheduleText);
            logActivity("save", `Saved the ${mode} plan locally`);
          }}
        >
          {(editing) => (
            <div className="space-y-3">
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  Editing is live — change any time, task, priority, duration or reason below.
                </p>
              ) : null}
              {schedule.map((b) => (
                <div
                  key={b.id}
                  className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[10rem_1fr]"
                >
                  <div className="space-y-2">
                    {editing ? (
                      <Input
                        value={b.time}
                        onChange={(e) => updateBlock(b.id, { time: e.target.value })}
                      />
                    ) : (
                      <p className="font-display text-sm font-semibold">{b.time}</p>
                    )}
                    {editing ? (
                      <Select
                        value={b.priority}
                        onValueChange={(v) => updateBlock(b.id, { priority: v as Priority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_STYLES[b.priority]}>{b.priority}</Badge>
                        <span className="text-xs text-muted-foreground">{b.duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <Input
                          value={b.task}
                          onChange={(e) => updateBlock(b.id, { task: e.target.value })}
                        />
                        <Input
                          value={b.duration}
                          onChange={(e) => updateBlock(b.id, { duration: e.target.value })}
                        />
                        <Textarea
                          rows={2}
                          value={b.reason}
                          onChange={(e) => updateBlock(b.id, { reason: e.target.value })}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">{b.task}</p>
                        <p className="text-sm leading-relaxed text-muted-foreground">{b.reason}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </OutputCard>
      ) : null}
    </div>
  );
}
