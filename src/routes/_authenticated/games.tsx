import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({ meta: [{ title: "Quiz Game — Wisdom Share" }] }),
  component: GamesPage,
});

type Q = { q: string; options: string[]; answer: number; topic: string };

const QUESTIONS: Q[] = [
  { topic: "Math", q: "What is the value of π (pi) to two decimal places?", options: ["3.12", "3.14", "3.16", "3.18"], answer: 1 },
  { topic: "Science", q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], answer: 2 },
  { topic: "Coding", q: "In JavaScript, which keyword declares a block-scoped variable?", options: ["var", "let", "def", "static"], answer: 1 },
  { topic: "General", q: "Who wrote the play 'Romeo and Juliet'?", options: ["Charles Dickens", "Mark Twain", "William Shakespeare", "Jane Austen"], answer: 2 },
  { topic: "Math", q: "What is 12 × 12?", options: ["124", "132", "144", "156"], answer: 2 },
  { topic: "Science", q: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2 },
  { topic: "Coding", q: "HTML stands for?", options: ["Hyper Trainer Marking Language", "HyperText Markup Language", "HighText Machine Language", "None"], answer: 1 },
  { topic: "GK", q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], answer: 2 },
  { topic: "Math", q: "Square root of 169 is?", options: ["11", "12", "13", "14"], answer: 2 },
  { topic: "Science", q: "H2O is the chemical formula of?", options: ["Salt", "Water", "Oxygen", "Hydrogen"], answer: 1 },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function GamesPage() {
  const [seed, setSeed] = useState(0);
  const quiz = useMemo(() => shuffle(QUESTIONS).slice(0, 5), [seed]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = quiz[idx];
  const isCorrect = selected !== null && selected === current.answer;

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (idx + 1 >= quiz.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setSeed((s) => s + 1);
    setIdx(0);
    setScore(0);
    setSelected(null);
    setDone(false);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-hero text-white shadow-glow">
            <Flame className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Knowledge Quiz</h1>
            <p className="text-sm text-muted-foreground">5 quick questions across math, science, coding and more.</p>
          </div>
        </div>

        {!done ? (
          <Card className="mt-6 p-6 bg-card-gradient">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Question {idx + 1} / {quiz.length}</span>
              <span className="rounded-full bg-accent px-2 py-0.5">{current.topic}</span>
              <span>Score: {score}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-hero transition-all" style={{ width: `${((idx + (selected !== null ? 1 : 0)) / quiz.length) * 100}%` }} />
            </div>

            <h2 className="mt-6 font-display text-xl font-semibold">{current.q}</h2>
            <div className="mt-4 grid gap-2">
              {current.options.map((opt, i) => {
                const isAnswer = i === current.answer;
                const isPicked = i === selected;
                const revealed = selected !== null;
                return (
                  <button
                    key={i}
                    onClick={() => pick(i)}
                    disabled={revealed}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      !revealed && "hover:bg-accent",
                      revealed && isAnswer && "border-green-500 bg-green-500/10",
                      revealed && isPicked && !isAnswer && "border-destructive bg-destructive/10",
                    )}
                  >
                    <span>{opt}</span>
                    {revealed && isAnswer && <CheckCircle2 className="size-4 text-green-600" />}
                    {revealed && isPicked && !isAnswer && <XCircle className="size-4 text-destructive" />}
                  </button>
                );
              })}
            </div>

            {selected !== null && (
              <div className="mt-6 flex items-center justify-between">
                <p className={cn("text-sm font-medium", isCorrect ? "text-green-600" : "text-destructive")}>
                  {isCorrect ? "Correct!" : `Answer: ${current.options[current.answer]}`}
                </p>
                <Button onClick={next}>{idx + 1 >= quiz.length ? "See result" : "Next question"}</Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="mt-6 p-8 text-center bg-card-gradient">
            <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-hero text-white shadow-glow">
              <Trophy className="size-7" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">
              You scored {score} / {quiz.length}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {score === quiz.length ? "Perfect run! 🏆" : score >= quiz.length / 2 ? "Nice work — keep learning!" : "Good try — a quick review and you'll ace it."}
            </p>
            <Button onClick={restart} className="mt-6 gap-2">
              <RotateCcw className="size-4" /> Play again
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
