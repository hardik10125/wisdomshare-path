import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { searchProfiles } from "@/lib/profile.functions";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search — Wisdom Share" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const searchFn = useServerFn(searchProfiles);
  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchFn({ data: { q } }),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-bold">Find learners</h1>
        <p className="mt-1 text-muted-foreground">Search by name, username, or interest (e.g. "Python")</p>
        <div className="relative mt-6">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 h-12" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(data ?? []).map((p: any) => (
            <Link
              key={p.id}
              to="/profile/$username"
              params={{ username: p.username }}
              className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow"
            >
              <Avatar className="size-12 ring-2 ring-primary/10">
                <AvatarImage src={p.avatar_url ?? undefined} />
                <AvatarFallback className="bg-hero text-white text-xs">{p.full_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{p.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                {p.bio && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{p.bio}</p>}
                {p.interests?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.interests.slice(0, 3).map((i: string) => (
                      <span key={i} className="rounded-full bg-accent px-2 py-0.5 text-[10px]">{i}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
          {!isFetching && data && data.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">No learners found</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
