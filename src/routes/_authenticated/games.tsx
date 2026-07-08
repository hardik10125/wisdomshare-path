import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Flame, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Knowledge Streak — Wisdom Share" }] }),
  component: GamesPage,
});

function GamesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="glass inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <Sparkles className="size-3 text-secondary" /> Coming in Phase 3
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Knowledge Streak</h1>
        <p className="mt-2 text-muted-foreground">Daily quizzes and code challenges to keep your learning momentum.</p>

        <Card className="mt-6 p-8 text-center bg-card-gradient">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-hero text-white shadow-glow">
            <Flame className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold">Current streak: 0 days</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The daily Quiz Challenge and "Guess the Output" games launch soon.
            Keep sharing notes to warm up your streak.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
