import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { aiChat } from "@/lib/ai.functions";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ai-chat")({
  head: () => ({ meta: [{ title: "AI Chat — Wisdom Share" }] }),
  component: AiChat,
});

type Msg = { role: "user" | "assistant"; content: string };

function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatFn = useServerFn(aiChat);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await chatFn({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col rounded-2xl border bg-card shadow-soft overflow-hidden">
        <header className="flex items-center gap-3 border-b p-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-hero text-white">
            <Bot className="size-5" />
          </span>
          <div>
            <h1 className="font-display font-bold">Wisdom Share AI</h1>
            <p className="text-xs text-muted-foreground">Educational assistant • asks only study questions</p>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-hero text-white shadow-glow">
                <Sparkles className="size-6" />
              </span>
              <p className="mt-4 font-medium">Ask me anything about your studies</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Try "Explain gradient descent" or "Debug this Python code"
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["Explain recursion simply", "Java vs Python for beginners", "Tips for competitive programming"].map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-accent">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-hero text-white")}>
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </span>
              <div className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm animate-fade-up",
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-hero text-white">
                <Bot className="size-4" />
              </span>
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="inline size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 border-t p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a study question…"
            disabled={loading}
            maxLength={4000}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
