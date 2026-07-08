import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { INTERESTS } from "@/lib/interests";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, saveInterests } from "@/lib/profile.functions";
import { toast } from "sonner";
import { Sparkles, Loader2, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/interests")({
  head: () => ({ meta: [{ title: "Pick your interests — Wisdom Share" }] }),
  component: InterestsPage,
});

function InterestsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const fetchMe = useServerFn(getMyProfile);
  const save = useServerFn(saveInterests);

  useEffect(() => {
    fetchMe().then((p) => {
      if (p?.interests?.length) setSelected(new Set(p.interests));
    });
  }, [fetchMe]);

  const toggle = (i: string) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const submit = async () => {
    if (selected.size === 0) return toast.error("Pick at least one interest");
    setLoading(true);
    try {
      await save({ data: { interests: Array.from(selected) } });
      toast.success("Interests saved");
      navigate({ to: "/home", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div aria-hidden className="absolute inset-0 bg-hero opacity-[0.06] dark:opacity-[0.12]" />
      <header className="relative flex h-16 items-center px-6"><Logo /></header>
      <div className="relative mx-auto max-w-3xl px-4 py-8">
        <div className="glass rounded-full inline-flex items-center gap-2 px-3 py-1 text-xs">
          <Sparkles className="size-3 text-secondary" /> Personalize your feed
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold">What do you want to learn?</h1>
        <p className="mt-2 text-muted-foreground">Pick a few topics — we'll tailor your feed, suggestions and games.</p>

        <div className="mt-8 flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = selected.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  on
                    ? "border-transparent bg-primary text-primary-foreground shadow-soft"
                    : "bg-card hover:border-primary/50 hover:bg-accent",
                )}
              >
                {on && <Check className="mr-1 inline size-3.5" />}
                {i}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{selected.size} selected</p>
          <Button onClick={submit} disabled={loading} size="lg">
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
