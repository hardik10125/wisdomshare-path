import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFeed } from "@/lib/posts.functions";
import { getMyProfile, searchProfiles } from "@/lib/profile.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home — Wisdom Share" }] }),
  component: HomePage,
});

function HomePage() {
  const feedFn = useServerFn(getFeed);
  const meFn = useServerFn(getMyProfile);
  const searchFn = useServerFn(searchProfiles);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed", "all"],
    queryFn: () => feedFn({ data: { scope: "all" } }),
  });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: suggested } = useQuery({
    queryKey: ["suggested"],
    queryFn: () => searchFn({ data: { q: "" } }),
  });

  const trending = Array.from(
    new Set((posts ?? []).flatMap((p: any) => p.author?.interests ?? []).concat(me?.interests ?? [])),
  ).slice(0, 8);

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="glass rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={me?.avatar_url ?? undefined} />
                <AvatarFallback className="bg-hero text-white text-xs">
                  {me?.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Link to="/upload" className="flex-1">
                <Button variant="outline" className="w-full justify-start text-muted-foreground">
                  Share your study material…
                </Button>
              </Link>
              <Link to="/upload">
                <Button size="icon" className="shrink-0"><Upload className="size-4" /></Button>
              </Link>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div key={i} className="rounded-2xl border p-4 space-y-3">
                  <div className="flex gap-3"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-10 flex-1" /></div>
                  <Skeleton className="h-64" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && posts && posts.length === 0 && (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <p className="text-muted-foreground">Your feed is empty. Upload the first post!</p>
              <Link to="/upload"><Button className="mt-4">Upload a post</Button></Link>
            </div>
          )}
          {posts?.map((p: any) => <PostCard key={p.id} post={p} />)}
        </div>

        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" /> Suggested learners</h3>
            <ul className="mt-3 space-y-3">
              {(suggested ?? []).filter((s: any) => s.id !== me?.id).slice(0, 5).map((s: any) => (
                <li key={s.id}>
                  <Link to="/profile/$username" params={{ username: s.username }} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent">
                    <Avatar className="size-9">
                      <AvatarImage src={s.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">{s.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{s.username}</p>
                    </div>
                  </Link>
                </li>
              ))}
              {(!suggested || suggested.length === 0) && <p className="text-xs text-muted-foreground">No learners yet</p>}
            </ul>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <h3 className="flex items-center gap-2 font-semibold"><TrendingUp className="size-4 text-secondary" /> Trending topics</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {trending.length === 0 ? <p className="text-xs text-muted-foreground">Nothing trending yet</p> :
                trending.map((t: string) => (
                  <span key={t} className="rounded-full bg-accent px-3 py-1 text-xs">#{t}</span>
                ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
