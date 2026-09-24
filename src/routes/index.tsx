import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck,
  MessagesSquare,
  NotebookPen,
  Search,
  Sparkle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppState, type ActivityKind } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your productivity home: plan tasks, research topics and ask AI, with a summary of recent activity.",
      },
      { property: "og:title", content: "Dashboard — AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Plan tasks, research topics and ask AI from one calm dashboard.",
      },
    ],
  }),
  component: Dashboard,
});

const FEATURES = [
  {
    to: "/planner" as const,
    title: "Plan My Tasks",
    body: "Turn your tasks, deadlines and available time into an editable daily or weekly schedule.",
    icon: CalendarCheck,
  },
  {
    to: "/research" as const,
    title: "Research a Topic",
    body: "Paste an article or name a topic and get a summary, key insights and recommendations.",
    icon: BrainCircuit,
  },
  {
    to: "/chat" as const,
    title: "Ask AI",
    body: "Talk through priorities, drafting, meetings or focus habits in a conversational workspace.",
    icon: MessagesSquare,
  },
];

const ICONS: Record<ActivityKind, typeof Sparkle> = {
  plan: CalendarCheck,
  research: Search,
  chat: MessagesSquare,
  save: NotebookPen,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { tasksPlanned, researchSessions, conversations, activity } = useAppState();

  const stats = [
    { label: "Tasks Planned", value: tasksPlanned, hint: "across daily & weekly plans" },
    { label: "Research Sessions", value: researchSessions, hint: "summaries & insight sets" },
    { label: "AI Conversations", value: conversations, hint: "workplace chat threads" },
  ];

  return (
    <div className="space-y-8">
      <section className="surface relative overflow-hidden px-6 py-8 sm:px-9 sm:py-10">
        <span className="absolute -right-16 -top-16 size-56 rounded-full bg-gradient-sky opacity-50" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkle className="size-3.5" /> Simulated AI · runs entirely in your browser
          </span>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            {greeting()}, how can AI help you today?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Start with a plan, dig into a topic, or just talk it through. Every result is editable,
            copyable and can be kept locally on this device.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/planner">
                Plan my day <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/chat">Ask the assistant</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(({ to, title, body, icon: Icon }) => (
          <Link key={to} to={to} className="group surface p-6 transition-shadow hover:shadow-lift">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Open
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="surface p-5">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </section>

      <section className="surface overflow-hidden">
        <header className="border-b border-border bg-muted px-5 py-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
        </header>
        <ul className="divide-y divide-border">
          {activity.map((item) => {
            const Icon = ICONS[item.kind];
            return (
              <li key={item.id} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.at > 1000
                      ? new Date(item.at).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Earlier this week"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
