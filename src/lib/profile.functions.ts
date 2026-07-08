import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const InterestsInput = z.object({ interests: z.array(z.string().min(1).max(50)).min(1).max(20) });
export const saveInterests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => InterestsInput.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ interests: data.interests })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const UpdateProfileInput = z.object({
  full_name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).optional(),
  avatar_url: z.string().url().max(500).optional().nullable(),
  cover_url: z.string().url().max(500).optional().nullable(),
  interests: z.array(z.string().min(1).max(50)).max(20).optional(),
  is_private: z.boolean().optional(),
});
export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => UpdateProfileInput.parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SearchInput = z.object({ q: z.string().trim().max(80) });
export const searchProfiles = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => SearchInput.parse(raw))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const q = data.q;
    if (!q) {
      const { data: recent } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, interests")
        .order("created_at", { ascending: false })
        .limit(20);
      return recent ?? [];
    }
    const pattern = `%${q}%`;
    const { data: rows } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, interests")
      .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
      .limit(30);
    // Also include interest matches
    const { data: byInterest } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, bio, interests")
      .contains("interests", [q]);
    const merged = new Map<string, NonNullable<typeof rows>[number]>();
    for (const r of rows ?? []) merged.set(r.id, r);
    for (const r of byInterest ?? []) merged.set(r.id, r);
    return Array.from(merged.values()).slice(0, 40);
  });

const UsernameInput = z.object({ username: z.string().min(1).max(60) });
export const getProfileByUsername = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => UsernameInput.parse(raw))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", data.username)
      .maybeSingle();
    if (!profile) return null;
    const [{ count: followers }, { count: following }, { count: posts }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
    ]);
    return { ...profile, followers: followers ?? 0, following: following ?? 0, post_count: posts ?? 0 };
  });

const IdInput = z.object({ target_id: z.string().uuid() });
export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => IdInput.parse(raw))
  .handler(async ({ context, data }) => {
    if (data.target_id === context.userId) throw new Error("Cannot follow yourself");
    const { data: existing } = await context.supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", context.userId)
      .eq("following_id", data.target_id)
      .maybeSingle();
    if (existing) {
      await context.supabase
        .from("follows")
        .delete()
        .eq("follower_id", context.userId)
        .eq("following_id", data.target_id);
      return { following: false };
    }
    await context.supabase
      .from("follows")
      .insert({ follower_id: context.userId, following_id: data.target_id });
    return { following: true };
  });
