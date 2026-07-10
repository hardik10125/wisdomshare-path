import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFeed } from "@/lib/posts.functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({ meta: [{ title: "Saved — Wisdom Share" }] }),
  component: SavedPage,
});

function SavedPage() {
  const feedFn = useServerFn(getFeed);
  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed", "saved"],
    queryFn: () => feedFn({ data: { scope: "saved" } }),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bookmark className="size-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Saved posts</h1>
            <p className="text-sm text-muted-foreground">Your bookmarked study materials, images and PDFs.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading && [0, 1].map((i) => (
            <div key={i} className="rounded-2xl border p-4 space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-48" />
            </div>
          ))}
          {!isLoading && posts && posts.length === 0 && (
            <div className="rounded-2xl border bg-card p-10 text-center">
              <p className="text-muted-foreground">Nothing saved yet. Tap the bookmark icon on any post to keep it here.</p>
              <Link to="/home"><Button className="mt-4">Explore feed</Button></Link>
            </div>
          )}
          {posts?.map((p: any) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
    </AppShell>
  );
}
