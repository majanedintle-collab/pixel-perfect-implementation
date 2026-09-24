import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { clearLocalData, useAppState } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Adjust your workspace preferences, review locally saved AI outputs and clear browser data.",
      },
      { property: "og:title", content: "Settings — AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Workspace preferences, locally saved outputs and data controls.",
      },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { savedNotes } = useAppState();
  const [name, setName] = useState("Dintle");
  const [role, setRole] = useState("Product Operations");
  const [breaks, setBreaks] = useState(true);
  const [weekend, setWeekend] = useState(false);
  const [verbose, setVerbose] = useState(true);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Preferences and saved outputs live in this browser only — there's no account and no server.
        </p>
      </header>

      <section className="surface p-6">
        <h2 className="text-base font-semibold">Profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pname">Display name</Label>
            <Input
              id="pname"
              className="mt-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="prole">Role</Label>
            <Input
              id="prole"
              className="mt-1.5"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
        </div>
        <Button className="mt-5" onClick={() => toast.success("Preferences updated")}>
          Save preferences
        </Button>
      </section>

      <section className="surface divide-y divide-border p-6">
        <h2 className="pb-4 text-base font-semibold">Planning preferences</h2>
        {[
          {
            label: "Include breaks in generated plans",
            hint: "Adds recovery breaks after long focus blocks.",
            value: breaks,
            set: setBreaks,
          },
          {
            label: "Allow weekend scheduling",
            hint: "Weekly plans may place low-priority work on Saturday.",
            value: weekend,
            set: setWeekend,
          },
          {
            label: "Explain prioritisation reasoning",
            hint: "Shows why each task sits where it does.",
            value: verbose,
            set: setVerbose,
          },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="text-sm font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.hint}</p>
            </div>
            <Switch checked={row.value} onCheckedChange={row.set} />
          </div>
        ))}
      </section>

      <section className="surface p-6">
        <h2 className="text-base font-semibold">Saved locally ({savedNotes.length})</h2>
        {savedNotes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing saved yet. Use “Save locally” on any AI output to keep it here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {savedNotes.map((n) => (
              <li key={n.id} className="rounded-xl border border-border p-4">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Separator className="my-5" />
        <Button
          variant="outline"
          onClick={() => {
            clearLocalData();
            toast.success("Local data cleared");
          }}
        >
          <Trash2 className="size-4" /> Clear local data
        </Button>
      </section>
    </div>
  );
}
