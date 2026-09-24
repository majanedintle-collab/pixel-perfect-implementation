import { useState, type ReactNode } from "react";
import { Check, Copy, Pencil, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface OutputCardProps {
  title: string;
  badge?: string;
  copyText: string;
  onRegenerate?: () => void;
  onSave?: () => void;
  children: (editing: boolean) => ReactNode;
}

export function OutputCard({
  title,
  badge = "AI generated",
  copyText,
  onRegenerate,
  onSave,
  children,
}: OutputCardProps) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Your browser blocked clipboard access");
    }
  };

  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <Badge variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent">
            {badge}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)}>
            <Pencil className="size-3.5" />
            {editing ? "Done" : "Edit"}
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            Copy
          </Button>
          {onRegenerate ? (
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RefreshCw className="size-3.5" />
              Regenerate
            </Button>
          ) : null}
          {onSave ? (
            <Button
              size="sm"
              onClick={() => {
                onSave();
                toast.success("Saved locally in this browser");
              }}
            >
              <Save className="size-3.5" />
              Save locally
            </Button>
          ) : null}
        </div>
      </header>
      <div className="px-5 py-5">{children(editing)}</div>
    </section>
  );
}
