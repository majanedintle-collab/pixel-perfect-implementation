import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";
import { toast } from "sonner";

import { OutputCard } from "@/components/OutputCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { generateResearch, type Length, type OutputType } from "@/lib/ai-sim";
import { bumpStat, logActivity, saveNote } from "@/lib/store";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "AI Research Assistant — Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Paste an article or name a topic and get an editable summary, key insights and recommendations.",
      },
      { property: "og:title", content: "AI Research Assistant — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "Editable summaries, key insights and recommendations for any workplace topic.",
      },
    ],
  }),
  component: Research,
});

const TYPES: OutputType[] = ["Summary", "Key Insights", "Recommendations"];
const LENGTHS: Length[] = ["Short", "Medium", "Detailed"];

interface Draft {
  summary: string;
  insights: string;
  recommendations: string;
}

function toDraft(topic: string, type: OutputType, length: Length, seed: number): Draft {
  const r = generateResearch(topic, type, length, seed);
  return {
    summary: r.summary,
    insights: r.insights.join("\n"),
    recommendations: r.recommendations.join("\n"),
  };
}

function Research() {
  const [topic, setTopic] = useState(
    "How AI assistants change knowledge work in professional teams",
  );
  const [type, setType] = useState<OutputType>("Summary");
  const [length, setLength] = useState<Length>("Medium");
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<Draft | null>(null);

  const run = (nextSeed = seed) => {
    if (!topic.trim()) {
      toast.error("Enter a topic or paste some text first");
      return;
    }
    setResult(toDraft(topic, type, length, nextSeed));
    bumpStat("researchSessions");
    logActivity("research", `Researched “${topic.slice(0, 60)}”`);
  };

  const text = result
    ? [
        "Summary",
        result.summary,
        "",
        "Key Insights",
        ...result.insights.split("\n").map((l, i) => `${i + 1}. ${l}`),
        "",
        "Recommendations",
        ...result.recommendations.split("\n").map((l, i) => `${i + 1}. ${l}`),
      ].join("\n")
    : "";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">AI Research Assistant</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Name a topic or paste an article. You'll get a structured response you can edit, copy,
          regenerate or keep on this device.
        </p>
      </header>

      <section className="surface p-6">
        <Label htmlFor="topic">Research topic or article text</Label>
        <Textarea
          id="topic"
          className="mt-1.5 min-h-32"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Reducing meeting load in distributed teams — or paste the full article here"
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Output type</Label>
            <Select value={type} onValueChange={(v) => setType(v as OutputType)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Length</Label>
            <Select value={length} onValueChange={(v) => setLength(v as Length)}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LENGTHS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="audience">Audience (optional)</Label>
            <Input id="audience" className="mt-1.5" placeholder="e.g. team leads" />
          </div>
        </div>
        <Button className="mt-5" onClick={() => run()}>
          <Sparkle className="size-4" /> Generate Research Summary
        </Button>
      </section>

      {result ? (
        <OutputCard
          title="Research output"
          copyText={text}
          onRegenerate={() => {
            const next = seed + 1;
            setSeed(next);
            run(next);
          }}
          onSave={() => {
            saveNote(topic.slice(0, 60), text);
            logActivity("save", `Saved research on “${topic.slice(0, 50)}” locally`);
          }}
        >
          {(editing) => (
            <div className="space-y-6">
              <div>
                <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </h4>
                {editing ? (
                  <Textarea
                    className="mt-2 min-h-28"
                    value={result.summary}
                    onChange={(e) => setResult({ ...result, summary: e.target.value })}
                  />
                ) : (
                  <p className="mt-2 text-sm leading-relaxed">{result.summary}</p>
                )}
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Key Insights
                </h4>
                {editing ? (
                  <Textarea
                    className="mt-2 min-h-32"
                    value={result.insights}
                    onChange={(e) => setResult({ ...result, insights: e.target.value })}
                  />
                ) : (
                  <ul className="mt-2 space-y-2">
                    {result.insights.split("\n").map((line, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommendations
                </h4>
                {editing ? (
                  <Textarea
                    className="mt-2 min-h-32"
                    value={result.recommendations}
                    onChange={(e) => setResult({ ...result, recommendations: e.target.value })}
                  />
                ) : (
                  <ol className="mt-2 space-y-2">
                    {result.recommendations.split("\n").map((line, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-accent text-[11px] font-semibold text-accent-foreground">
                          {i + 1}
                        </span>
                        {line}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </OutputCard>
      ) : null}
    </div>
  );
}
