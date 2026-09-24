/**
 * Simulated AI engine. Entirely frontend — no API, no backend, no keys.
 * Responses are templated but adapt to the user's actual input.
 */

export type Priority = "Urgent" | "High" | "Medium" | "Low";

export interface TaskInput {
  id: string;
  name: string;
  deadline: string;
  priority: Priority;
  estimate: string;
  notes?: string;
}

export interface ScheduleBlock {
  id: string;
  time: string;
  task: string;
  priority: Priority;
  duration: string;
  reason: string;
}

export const PLANNER_PROMPT =
  "Create a realistic productivity schedule based on my tasks, deadlines, priorities and available time. Prioritize urgent and important tasks while including reasonable breaks.";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

const REASONS: Record<Priority, string[]> = {
  Urgent: [
    "Deadline is imminent — scheduled first while focus is highest.",
    "Blocking other work, so clearing it early unblocks the rest of the day.",
  ],
  High: [
    "High impact on this week's outcomes; placed in a deep-focus window.",
    "Important but not yet urgent — handled before it escalates.",
  ],
  Medium: [
    "Moderate impact; slotted after the morning focus block.",
    "Steady-progress item that benefits from a mid-day slot.",
  ],
  Low: [
    "Low effort and low urgency — good fit for the post-lunch energy dip.",
    "Can be batched with admin work without losing momentum.",
  ],
};

function minutesFromEstimate(estimate: string): number {
  const text = estimate.toLowerCase();
  const num = parseFloat(text.replace(/[^0-9.]/g, ""));
  if (!num || Number.isNaN(num)) return 60;
  if (text.includes("min")) return Math.min(240, Math.max(15, Math.round(num)));
  return Math.min(300, Math.max(15, Math.round(num * 60)));
}

function fmt(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

function humanDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function sortTasks(tasks: TaskInput[]): TaskInput[] {
  return [...tasks].sort((a, b) => {
    const p = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
    if (p !== 0) return p;
    if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
    return 0;
  });
}

export function generateDailyPlan(tasks: TaskInput[], seed = 0): ScheduleBlock[] {
  const ordered = sortTasks(tasks);
  const blocks: ScheduleBlock[] = [];
  let cursor = 9 * 60; // 09:00
  let sinceBreak = 0;

  ordered.forEach((task, index) => {
    const mins = minutesFromEstimate(task.estimate);
    const reasons = REASONS[task.priority];
    blocks.push({
      id: uid(),
      time: `${fmt(cursor)} – ${fmt(cursor + mins)}`,
      task: task.name,
      priority: task.priority,
      duration: humanDuration(mins),
      reason:
        reasons[(index + seed) % reasons.length] +
        (task.deadline ? ` Due ${task.deadline}.` : "") +
        (task.notes ? ` Note: ${task.notes}` : ""),
    });
    cursor += mins;
    sinceBreak += mins;

    if (sinceBreak >= 90 && index < ordered.length - 1) {
      const breakLen = sinceBreak >= 150 ? 30 : 15;
      blocks.push({
        id: uid(),
        time: `${fmt(cursor)} – ${fmt(cursor + breakLen)}`,
        task: breakLen === 30 ? "Lunch & reset walk" : "Short recovery break",
        priority: "Low",
        duration: humanDuration(breakLen),
        reason: "Sustained focus decays after ~90 minutes; a break protects the next block.",
      });
      cursor += breakLen;
      sinceBreak = 0;
    }
  });

  blocks.push({
    id: uid(),
    time: `${fmt(cursor)} – ${fmt(cursor + 20)}`,
    task: "End-of-day review & tomorrow's shortlist",
    priority: "Medium",
    duration: "20 min",
    reason: "Closing the loop keeps momentum and reduces start-up cost tomorrow.",
  });

  return blocks;
}

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function generateWeeklyPlan(tasks: TaskInput[], seed = 0): ScheduleBlock[] {
  const ordered = sortTasks(tasks);
  return ordered.map((task, index) => {
    const day = WEEK[(index + seed) % WEEK.length];
    const start = 9 * 60 + (index % 3) * 150;
    const mins = minutesFromEstimate(task.estimate);
    const reasons = REASONS[task.priority];
    return {
      id: uid(),
      time: `${day}, ${fmt(start)} – ${fmt(start + mins)}`,
      task: task.name,
      priority: task.priority,
      duration: humanDuration(mins),
      reason:
        `Placed on ${day} to spread cognitive load across the week. ` +
        reasons[(index + seed) % reasons.length] +
        (task.deadline ? ` Due ${task.deadline}.` : ""),
    };
  });
}

/* ---------------- Research assistant ---------------- */

export type OutputType = "Summary" | "Key Insights" | "Recommendations";
export type Length = "Short" | "Medium" | "Detailed";

export interface ResearchResult {
  topic: string;
  summary: string;
  insights: string[];
  recommendations: string[];
}

const INSIGHT_TEMPLATES = [
  "Teams that document decisions around {t} cut repeat meetings by roughly a third, because context stops living in people's heads.",
  "The bottleneck in {t} is rarely tooling — it is unclear ownership and vague definitions of \"done\".",
  "Early wins in {t} come from removing low-value work before adding new processes on top of it.",
  "Measurement matters: without a baseline, improvements in {t} are indistinguishable from normal week-to-week variation.",
  "Adoption of {t} follows the path of least friction; the version people actually use beats the ideal version nobody opens.",
  "Knowledge work around {t} compounds when outputs are reusable — templates, checklists and shared briefs outlive individual projects.",
];

const REC_TEMPLATES = [
  "Run a two-week pilot on {t} with one team and a single success metric before any wider rollout.",
  "Write a one-page brief defining scope, owner and review date for {t}; circulate it before the first working session.",
  "Block two protected deep-work sessions per week for {t} and treat them as unmovable meetings.",
  "Automate or template the most repeated step in {t} first — it usually pays back within a month.",
  "Review progress on {t} every Friday in 15 minutes: what moved, what stalled, what gets dropped.",
  "Capture verified sources and assumptions for {t} in one shared document so conclusions can be re-checked later.",
];

function pick<T>(list: T[], count: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < count; i++) out.push(list[(i * 2 + seed) % list.length]);
  return out;
}

export function generateResearch(
  topicOrText: string,
  type: OutputType,
  length: Length,
  seed = 0,
): ResearchResult {
  const raw = topicOrText.trim();
  const isArticle = raw.length > 180;
  const topic = isArticle
    ? raw.split(/[.!?\n]/)[0].slice(0, 70).trim() || "the supplied text"
    : raw || "workplace productivity";
  const count = length === "Short" ? 3 : length === "Medium" ? 4 : 6;

  const depth =
    length === "Short"
      ? ""
      : length === "Medium"
        ? ` Evidence from workplace research consistently points the same way: clarity of priorities predicts output far better than hours worked, and the gains are largest for teams that review their own process regularly.`
        : ` Evidence from workplace research consistently points the same way: clarity of priorities predicts output far better than hours worked. Across knowledge-work settings, three levers do most of the work — reducing context switching, making decisions visible, and shortening feedback loops. Technology and AI assistance accelerate each lever, but only once the underlying priorities are explicit; applied to an unclear process, automation tends to scale the confusion rather than remove it.`;

  const summary =
    (isArticle
      ? `The text focuses on ${topic.toLowerCase()}. Its central argument is that professional output improves when attention is deliberately allocated rather than reactively spent.`
      : `${topic.charAt(0).toUpperCase()}${topic.slice(1)} sits at the intersection of professional development, technology adoption and day-to-day workflow design.`) +
    ` The practical picture is less about working harder and more about sequencing: high-value work first, batched shallow work later, and explicit checkpoints to catch drift early.` +
    depth +
    (type === "Summary" ? "" : ` Requested focus: ${type.toLowerCase()}.`);

  return {
    topic,
    summary,
    insights: pick(INSIGHT_TEMPLATES, type === "Key Insights" ? count + 1 : count, seed).map((t) =>
      t.replace(/\{t\}/g, topic.toLowerCase()),
    ),
    recommendations: pick(
      REC_TEMPLATES,
      type === "Recommendations" ? count + 1 : Math.max(3, count - 1),
      seed + 1,
    ).map((t) => t.replace(/\{t\}/g, topic.toLowerCase())),
  };
}

export function researchToText(r: ResearchResult): string {
  return [
    `Summary`,
    r.summary,
    ``,
    `Key Insights`,
    ...r.insights.map((i, n) => `${n + 1}. ${i}`),
    ``,
    `Recommendations`,
    ...r.recommendations.map((i, n) => `${n + 1}. ${i}`),
  ].join("\n");
}

/* ---------------- Workplace chat ---------------- */

export function generateChatReply(message: string): string {
  const m = message.toLowerCase();

  if (/plan|schedule|workday|day/.test(m)) {
    return `Here's a workable shape for your day:

• 9:00 – 10:30 — Deep work on your single most consequential task. No inbox, no chat.
• 10:30 – 10:45 — Break, away from the screen.
• 10:45 – 12:00 — Second focus block, ideally something with a near deadline.
• 12:00 – 13:00 — Lunch and a short walk.
• 13:00 – 14:30 — Meetings and collaborative work, batched together.
• 14:30 – 16:00 — Shallow work: email, approvals, small follow-ups.
• 16:00 – 16:20 — Review the day and pick tomorrow's top three.

If you tell me your actual tasks and deadlines, the Task Planner will turn this into a scheduled plan you can edit.`;
  }

  if (/prioriti[sz]e|urgent|important|too much|overwhelm/.test(m)) {
    return `Try sorting on two questions only: what has a real deadline, and what changes an outcome if it's done well.

1. Deadline-driven and high impact → do today, in your first focus block.
2. High impact, no deadline yet → protect one scheduled block this week, or it will quietly become urgent.
3. Deadline-driven but low impact → cap the time you spend and stop at "good enough".
4. Neither → drop it, delegate it, or park it in a review list you check weekly.

Anything you can't place in those four buckets usually needs a clearer definition of done rather than more time.`;
  }

  if (/summar|research|article|read|topic/.test(m)) {
    return `Give me the topic or paste the text into the Research Assistant and pick an output type — Summary, Key Insights or Recommendations.

For a fast read, I'd suggest: Summary first to confirm the argument, Key Insights to extract what's reusable, then Recommendations for what to actually do next. Short length is enough for a scan; Detailed is worth it when you'll share the output with others.`;
  }

  if (/improve|productiv|focus|habit|better/.test(m)) {
    return `Three changes tend to produce most of the gain:

• Protect one uninterrupted 90-minute block each morning and defend it like a meeting.
• Batch communication into two or three windows instead of reacting continuously — context switching is the real cost, not the messages.
• End each day by naming tomorrow's top three. Starting decisions are expensive when made cold.

Measure one thing for two weeks — focused hours, or tasks closed — so you can tell whether a change actually worked.`;
  }

  if (/email|message|write|draft/.test(m)) {
    return `A reliable structure for professional writing: context in one line, the ask in the second, detail below, deadline last.

Example: "Following Tuesday's review — I need your sign-off on the revised scope. Changes are in the attached one-pager; the two open questions are cost and timeline. Could you reply by Thursday midday?"

Short, specific, and easy to act on beats polite and vague almost every time.`;
  }

  if (/meeting|standup|agenda/.test(m)) {
    return `Before the meeting, write the decision you need, not the topic. Then: 5 minutes of context, 15 minutes on the decision, 5 minutes on owners and dates.

If there's no decision to make, a written update is usually cheaper. If it runs over, stop and schedule a follow-up rather than drifting — decisions made past the time box tend to be revisited anyway.`;
  }

  return `Happy to help with that. To give you something concrete, it helps to know two things: the outcome you want, and your realistic time available.

In the meantime: for planning, the Task Planner will build an editable schedule from your tasks and deadlines. For reading and analysis, the Research Assistant will produce a summary, insights and recommendations you can edit. And you can keep asking here — I'll adapt as you add detail.`;
}

export const SUGGESTED_PROMPTS = [
  "Help me plan my workday",
  "Summarize this topic",
  "How can I improve my productivity?",
  "Help me prioritize these tasks",
];
