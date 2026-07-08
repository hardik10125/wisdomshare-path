import { useState } from "react";
import { Heart, MessageCircle, Bookmark, Share2, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import type { FeedPost } from "@/lib/posts.functions";
import { addComment, getComments, toggleLike, toggleSave } from "@/lib/posts.functions";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function PostCard({ post }: { post: FeedPost }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const likeFn = useServerFn(toggleLike);
  const saveFn = useServerFn(toggleSave);
  const commentFn = useServerFn(addComment);
  const commentsFn = useServerFn(getComments);

  const like = useMutation({
    mutationFn: () => likeFn({ data: { post_id: post.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });
  const save = useMutation({
    mutationFn: () => saveFn({ data: { post_id: post.id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success(r.saved ? "Saved to bookmarks" : "Removed bookmark");
    },
  });
  const send = useMutation({
    mutationFn: (content: string) => commentFn({ data: { post_id: post.id, content } }),
    onSuccess: () => {
      setComment("");
      qc.invalidateQueries({ queryKey: ["comments", post.id] });
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", post.id],
    queryFn: () => commentsFn({ data: { post_id: post.id } }),
    enabled: showComments,
  });

  const share = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/profile/${post.author.username}` : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `${post.author.full_name} on Wisdom Share`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
    }
  };

  return (
    <article className="rounded-2xl border bg-card shadow-soft animate-fade-up overflow-hidden">
      <header className="flex items-center gap-3 p-4">
        <Link to="/profile/$username" params={{ username: post.author.username }}>
          <Avatar className="size-10 ring-2 ring-primary/10">
            <AvatarImage src={post.author.avatar_url ?? undefined} />
            <AvatarFallback className="bg-hero text-white text-xs">
              {post.author.full_name?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to="/profile/$username"
            params={{ username: post.author.username }}
            className="block font-semibold truncate hover:underline"
          >
            {post.author.full_name}
          </Link>
          <p className="text-xs text-muted-foreground">
            @{post.author.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
      </header>
      {post.caption && <p className="px-4 pb-3 text-sm whitespace-pre-wrap">{post.caption}</p>}
      {post.media_url && post.media_type === "image" && (
        <div className="bg-muted">
          <img src={post.media_url} alt="Study material" loading="lazy" className="w-full max-h-[600px] object-contain" />
        </div>
      )}
      {post.media_url && post.media_type === "pdf" && (
        <a
          href={post.media_url}
          target="_blank"
          rel="noreferrer"
          className="mx-4 mb-4 flex items-center gap-3 rounded-xl border bg-accent/40 p-4 hover:bg-accent transition-colors"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="size-5" />
          </span>
          <div>
            <p className="font-medium text-sm">Open study PDF</p>
            <p className="text-xs text-muted-foreground">Click to view or download</p>
          </div>
        </a>
      )}
      <div className="flex items-center gap-1 border-t px-2 py-1">
        <Button variant="ghost" size="sm" onClick={() => like.mutate()} className="gap-2">
          <Heart className={cn("size-4", post.liked_by_me && "fill-destructive text-destructive")} />
          <span className="text-xs">{post.like_count}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)} className="gap-2">
          <MessageCircle className="size-4" />
          <span className="text-xs">{post.comment_count}</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={share} className="gap-2">
          <Share2 className="size-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => save.mutate()}>
          <Bookmark className={cn("size-4", post.saved_by_me && "fill-primary text-primary")} />
        </Button>
      </div>
      {showComments && (
        <div className="border-t p-4 space-y-3">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {(comments ?? []).map((c: any) => (
              <div key={c.id} className="flex gap-2">
                <Avatar className="size-7">
                  <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">{c.profiles?.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                  <p className="font-medium text-xs">@{c.profiles?.username}</p>
                  <p>{c.content}</p>
                </div>
              </div>
            ))}
            {comments && comments.length === 0 && (
              <p className="text-xs text-muted-foreground">Be the first to comment</p>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const c = comment.trim();
              if (c) send.mutate(c);
            }}
          >
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment…" maxLength={500} />
            <Button type="submit" disabled={send.isPending || !comment.trim()}>Post</Button>
          </form>
        </div>
      )}
    </article>
  );
}
