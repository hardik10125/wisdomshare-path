import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, updateProfile } from "@/lib/profile.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Wisdom Share" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const meFn = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateProfile);
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  const [newPass, setNewPass] = useState("");
  const [changing, setChanging] = useState(false);

  const changePassword = async () => {
    if (newPass.length < 6) return toast.error("Password must be at least 6 characters");
    setChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      toast.success("Password updated");
      setNewPass("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setChanging(false); }
  };

  const setPrivacy = async (is_private: boolean) => {
    await updateFn({ data: { is_private } });
    qc.invalidateQueries({ queryKey: ["me"] });
    toast.success(is_private ? "Profile set to private" : "Profile set to public");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-3xl font-bold">Settings</h1>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Account</h2>
          <div>
            <Label>Email</Label>
            <Input value={me?.id ? "" : ""} placeholder="Signed in" readOnly disabled />
          </div>
          <div>
            <Label>New password</Label>
            <div className="flex gap-2">
              <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Min 6 characters" />
              <Button onClick={changePassword} disabled={changing || !newPass}>
                {changing && <Loader2 className="mr-2 size-4 animate-spin" />}
                Update
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark</p>
            </div>
            <ThemeToggle />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Privacy</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Private profile</p>
              <p className="text-xs text-muted-foreground">Only followers can see your posts (coming soon)</p>
            </div>
            <Switch checked={!!me?.is_private} onCheckedChange={setPrivacy} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">About</h2>
          <p className="text-sm text-muted-foreground">Wisdom Share v1.0 · Built with love for learners.</p>
        </Card>

        <Button variant="destructive" onClick={signOut} className="gap-2">
          <LogOut className="size-4" /> Logout
        </Button>
      </div>
    </AppShell>
  );
}
