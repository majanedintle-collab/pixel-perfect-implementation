import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, Sparkle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SUGGESTED_PROMPTS, generateChatReply, uid } from "@/lib/ai-sim";
import { bumpStat, logActivity } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chat — Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Talk through priorities, planning, drafting and focus habits with a simulated workplace AI assistant.",
      },
      { property: "og:title", content: "AI Workplace Chat — Workplace Productivity Assistant" },
      {
        property: "og:description",
        content: "A conversational workspace for planning, prioritizing and professional writing.",
      },
    ],
  }),
  component: Chat,
});

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: "assistant",
      text: "Hi — I'm your workplace assistant. Tell me what you're working on, or pick one of the prompts below to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { id: uid(), role: "user", text }]);
    setInput("");
    setThinking(true);
    bumpStat("conversations");
    logActivity("chat", `Asked AI: “${text.slice(0, 60)}”`);

    setTimeout(
      () => {
        setMessages((m) => [...m, { id: uid(), role: "assistant", text: generateChatReply(text) }]);
        setThinking(false);
        inputRef.current?.focus();
      },
      700 + Math.random() * 500,
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">AI Workplace Chat</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Simulated responses, generated on this device. Great for thinking out loud about
          priorities, planning and professional writing.
        </p>
      </header>

      <div className="surface flex h-[34rem] flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" ? (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Sparkle className="size-4" />
                </span>
              ) : null}
              <div
                className={cn(
                  "max-w-[46rem] whitespace-pre-wrap text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Sparkle className="size-4 animate-pulse" />
              </span>
              Thinking…
            </div>
          ) : null}
          <div ref={endRef} />
        </div>

        <div className="border-t border-border bg-muted px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about planning, prioritizing, writing or focus…"
              className="min-h-11 resize-none bg-card"
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={thinking}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
