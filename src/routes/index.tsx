import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Bot, Sparkles, Users, BookOpen, ShieldCheck, Flame } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 md:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/auth"><Button variant="ghost">Login</Button></Link>
          <Link to="/auth" search={{ mode: "register" as const }}>
            <Button>Register</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-hero opacity-[0.08] dark:opacity-[0.15]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center md:py-32">
          <div className="glass mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium animate-fade-up">
            <Sparkles className="size-3.5 text-secondary" />
            AI-powered educational social network
          </div>
          <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight md:text-7xl animate-fade-up">
            Learn. Share.{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-up">
            Share your study materials, connect with fellow learners, and get instant help
            from an AI tutor that only speaks about learning.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up">
            <Link to="/auth" search={{ mode: "register" as const }}>
              <Button size="lg" className="gap-2 shadow-glow">
                Get Started <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">Learn More</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
          Built for the way you actually study
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
          Every feature is tuned toward focused learning — no doomscrolling, no distractions.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "AI Study Assistant",
              desc: "Ask questions on programming, math, science, or your notes. If it's not study-related, it politely declines.",
            },
            {
              icon: ShieldCheck,
              title: "AI-verified Uploads",
              desc: "Every image is checked by AI before it hits your feed. Only genuine study material makes it through.",
            },
            {
              icon: Users,
              title: "Peer Learning Feed",
              desc: "Follow learners in your interests, like and comment on notes, save what matters for later.",
            },
            {
              icon: BookOpen,
              title: "Notes & PDFs",
              desc: "Upload handwritten notes, whiteboards, coding screenshots, flowcharts, and full PDFs.",
            },
            {
              icon: Flame,
              title: "Knowledge Streak",
              desc: "Come soon — daily quizzes and code-debug challenges that reward consistency.",
            },
            {
              icon: Sparkles,
              title: "Beautiful, calm UI",
              desc: "Glassmorphism, dark mode, smooth animations — designed to keep you focused.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-glow"
            >
              <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-hero text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-hero p-10 text-center text-white shadow-glow md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to study smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Join Wisdom Share and turn your notes into knowledge everyone can grow from.
          </p>
          <div className="mt-8">
            <Link to="/auth" search={{ mode: "register" as const }}>
              <Button size="lg" variant="secondary" className="gap-2">
                Create free account <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <Logo compact /> © {new Date().getFullYear()} Wisdom Share
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-foreground">About</a>
            <a href="#features" className="hover:text-foreground">Contact</a>
            <a href="#features" className="hover:text-foreground">Privacy</a>
            <a href="#features" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
