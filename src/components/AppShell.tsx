import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BrainCircuit,
  CalendarCheck,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Settings as SettingsIcon,
  Sparkle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/planner", label: "AI Task Planner", icon: CalendarCheck },
  { to: "/research", label: "AI Research Assistant", icon: BrainCircuit },
  { to: "/chat", label: "AI Workplace Chat", icon: MessagesSquare },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const DISCLAIMER =
  "AI-generated outputs are provided as productivity support and may contain errors or omissions. Review and verify important information before making professional decisions. Do not enter confidential, sensitive, or personal information.";

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-gradient-sky text-sky-foreground shadow-soft">
        <Sparkle className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold text-sidebar-foreground">
          Workplace AI
        </span>
        <span className="block text-xs text-sidebar-foreground/60">Productivity Assistant</span>
      </span>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col gap-8 bg-gradient-teal p-5">
      <Brand />
      <NavItems onNavigate={onNavigate} />
      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent p-3 text-xs leading-relaxed text-sidebar-foreground/70">
        Prototype mode — all AI responses are simulated in your browser. Nothing leaves this device.
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">
        <SidebarBody />
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-display text-sm font-semibold">Workplace AI</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <footer className="border-t border-border px-4 py-5 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl rounded-xl border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Responsible AI notice — </span>
            {DISCLAIMER}
          </div>
        </footer>
      </div>
    </div>
  );
}
