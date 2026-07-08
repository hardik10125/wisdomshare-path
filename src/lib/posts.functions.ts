import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CreatePostInput = z.object({
  caption: z.string().trim().max(2000),
  media_url: z.string().url().max(1000).nullable().optional(),
  media_type: z.enum(["image", "pdf"]).nullable().optional(),
});

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CreatePostInput.parse(raw))
  .handler(async ({ context, data }) => {
    if (!data.caption && !data.media_url) throw new Error("Post must have text or media");
    const { data: row, error } = await context.supabase
      .from("posts")
      .insert({
        user_id: context.userId,
        caption: data.caption,
        media_url: data.media_url ?? null,
        media_type: data.media_type ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export type FeedPost = {
  id: string;
  caption: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  author: { id: string; username: string; full_name: string; avatar_url: string | null };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
};

async function loadFeedInternal(supabase: any, userId: string | null, filter: "all" | "saved" | { userId: string }) {
  let query = supabase
    .from("posts")
    .select("id, caption, media_url, media_type, created_at, user_id, profiles:user_id(id, username, full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (typeof filter === "object") query = query.eq("user_id", filter.userId);
  const { data: posts, error } = await query;
  if (error) throw new Error(error.message);
  const ids = (posts ?? []).map((p: any) => p.id);
  if (ids.length === 0) return [] as FeedPost[];

  const [{ data: likes }, { data: comments }, myLikes, mySaves, savedSet] = await Promise.all([
    supabase.from("likes").select("post_id").in("post_id", ids),
    supabase.from("comments").select("post_id").in("post_id", ids),
    userId
      ? supabase.from("likes").select("post_id").eq("user_id", userId).in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    userId
      ? supabase.from("saves").select("post_id").eq("user_id", userId).in("post_id", ids)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    filter === "saved" && userId
      ? supabase.from("saves").select("post_id").eq("user_id", userId).then((r: any) => new Set((r.data ?? []).map((s: any) => s.post_id)))
      : Promise.resolve(null),
  ]);

  const likeCounts = new Map<string, number>();
  for (const l of likes ?? []) likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1);
  const commentCounts = new Map<string, number>();
  for (const c of comments ?? []) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
  const likedSet = new Set(((myLikes as any).data ?? []).map((l: any) => l.post_id));
  const savedByMe = new Set(((mySaves as any).data ?? []).map((s: any) => s.post_id));

  let filtered = posts ?? [];
  if (filter === "saved" && savedSet) filtered = filtered.filter((p: any) => savedSet.has(p.id));

  return filtered.map((p: any): FeedPost => ({
    id: p.id,
    caption: p.caption,
    media_url: p.media_url,
    media_type: p.media_type,
    created_at: p.created_at,
    author: p.profiles,
    like_count: likeCounts.get(p.id) ?? 0,
    comment_count: commentCounts.get(p.id) ?? 0,
    liked_by_me: likedSet.has(p.id),
    saved_by_me: savedByMe.has(p.id),
  }));
}

const FeedInput = z.object({ scope: z.enum(["all", "saved"]).default("all") });
export const getFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => FeedInput.parse(raw ?? {}))
  .handler(async ({ context, data }) => {
    return loadFeedInternal(context.supabase, context.userId, data.scope);
  });

const UserPostsInput = z.object({ user_id: z.string().uuid() });
export const getUserPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UserPostsInput.parse(raw))
  .handler(async ({ context, data }) => {
    return loadFeedInternal(context.supabase, context.userId, { userId: data.user_id });
  });

const PostIdInput = z.object({ post_id: z.string().uuid() });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIdInput.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", context.userId)
      .eq("post_id", data.post_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("likes").delete().eq("user_id", context.userId).eq("post_id", data.post_id);
      return { liked: false };
    }
    await context.supabase.from("likes").insert({ user_id: context.userId, post_id: data.post_id });
    return { liked: true };
  });

export const toggleSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => PostIdInput.parse(raw))
  .handler(async ({ context, data }) => {
    const { data: existing } = await context.supabase
      .from("saves")
      .select("post_id")
      .eq("user_id", context.userId)
      .eq("post_id", data.post_id)
      .maybeSingle();
    if (existing) {
      await context.supabase.from("saves").delete().eq("user_id", context.userId).eq("post_id", data.post_id);
      return { saved: false };
    }
    await context.supabase.from("saves").insert({ user_id: context.userId, post_id: data.post_id });
    return { saved: true };
  });

const CommentInput = z.object({ post_id: z.string().uuid(), content: z.string().trim().min(1).max(500) });
export const addComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => CommentInput.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("comments")
      .insert({ post_id: data.post_id, user_id: context.userId, content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getComments = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => PostIdInput.parse(raw))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: rows } = await supabase
      .from("comments")
      .select("id, content, created_at, profiles:user_id(username, full_name, avatar_url)")
      .eq("post_id", data.post_id)
      .order("created_at", { ascending: true })
      .limit(100);
    return rows ?? [];
  });
