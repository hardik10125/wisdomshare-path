import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useServerFn } from "@tanstack/react-start";
import { getProfileByUsername, getMyProfile, updateProfile, toggleFollow } from "@/lib/profile.functions";
import { getUserPosts } from "@/lib/posts.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { INTERESTS } from "@/lib/interests";
import { cn } from "@/lib/utils";
import { Share2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile/$username")({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — Wisdom Share` }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getP = useServerFn(getProfileByUsername);
  const meFn = useServerFn(getMyProfile);
  const postsFn = useServerFn(getUserPosts);
  const updateFn = useServerFn(updateProfile);
  const followFn = useServerFn(toggleFollow);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getP({ data: { username } }),
  });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const { data: posts } = useQuery({
    queryKey: ["user-posts", profile?.id],
    queryFn: () => postsFn({ data: { user_id: profile!.id } }),
    enabled: !!profile?.id,
  });

  const isMe = me?.id === profile?.id;
  const [editOpen, setEditOpen] = useState(false);

  const follow = useMutation({
    mutationFn: () => followFn({ data: { target_id: profile!.id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", username] }),
  });

  const share = () => {
    const url = `${window.location.origin}/profile/${username}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Profile link copied"));
  };

  if (isLoading) return <AppShell><div className="flex justify-center p-20"><Loader2 className="size-6 animate-spin" /></div></AppShell>;
  if (!profile) return <AppShell><p>Profile not found. <Link to="/home" className="text-primary">Home</Link></p></AppShell>;

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="h-40 bg-hero md:h-56" style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" } : {}} />
        <div className="p-6 pt-0">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <Avatar className="size-24 ring-4 ring-background">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-hero text-white text-2xl">{profile.full_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button variant="outline" onClick={share}><Share2 className="mr-2 size-4" /> Share</Button>
              {isMe ? (
                <Button onClick={() => setEditOpen(true)}><Pencil className="mr-2 size-4" /> Edit Profile</Button>
              ) : (
                <Button onClick={() => follow.mutate()} disabled={follow.isPending}>Follow</Button>
              )}
            </div>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">{profile.full_name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-3 text-sm whitespace-pre-wrap">{profile.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests?.map((i: string) => (
              <span key={i} className="rounded-full bg-accent px-3 py-1 text-xs">{i}</span>
            ))}
          </div>
          <div className="mt-5 flex gap-6 text-sm">
            <span><b>{profile.post_count}</b> <span className="text-muted-foreground">posts</span></span>
            <span><b>{profile.followers}</b> <span className="text-muted-foreground">followers</span></span>
            <span><b>{profile.following}</b> <span className="text-muted-foreground">following</span></span>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-bold">Posts</h2>
      <div className="mt-4 space-y-4">
        {posts?.map((p: any) => <PostCard key={p.id} post={p} />)}
        {posts && posts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet</p>}
      </div>

      {isMe && (
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["profile", username] });
            await qc.invalidateQueries({ queryKey: ["me"] });
            setEditOpen(false);
            // If username changed, redirect
            const fresh = await meFn();
            if (fresh && fresh.username !== username) navigate({ to: "/profile/$username", params: { username: fresh.username }, replace: true });
          }}
          updateFn={updateFn as any}
        />
      )}
    </AppShell>
  );
}

function EditProfileDialog({
  open, onClose, profile, onSaved, updateFn,
}: { open: boolean; onClose: () => void; profile: any; onSaved: () => void; updateFn: (opts: any) => Promise<any> }) {
  const [full_name, setFullName] = useState(profile.full_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [interests, setInterests] = useState<Set<string>>(new Set(profile.interests ?? []));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar_url, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [cover_url, setCoverUrl] = useState<string | null>(profile.cover_url);

  const uploadImg = async (kind: "avatar" | "cover", file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signed) {
        if (kind === "avatar") setAvatarUrl(signed.signedUrl);
        else setCoverUrl(signed.signedUrl);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({ data: { full_name, bio, interests: Array.from(interests), avatar_url, cover_url } });
      toast.success("Profile updated");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Avatar</Label>
              <div className="mt-2 flex items-center gap-3">
                <Avatar className="size-14"><AvatarImage src={avatar_url ?? undefined} /><AvatarFallback>{full_name[0]}</AvatarFallback></Avatar>
                <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg("avatar", f); }} />
              </div>
            </div>
            <div>
              <Label>Cover</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-14 w-24 rounded-lg bg-hero bg-cover bg-center" style={cover_url ? { backgroundImage: `url(${cover_url})` } : {}} />
                <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg("cover", f); }} />
              </div>
            </div>
          </div>
          <div><Label>Name</Label><Input value={full_name} onChange={(e) => setFullName(e.target.value)} maxLength={80} /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} /></div>
          <div>
            <Label>Interests</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = interests.has(i);
                return (
                  <button key={i} type="button" onClick={() => {
                    const next = new Set(interests);
                    on ? next.delete(i) : next.add(i);
                    setInterests(next);
                  }}
                    className={cn("rounded-full border px-3 py-1 text-xs", on ? "bg-primary text-primary-foreground border-transparent" : "bg-card")}>
                    {i}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
