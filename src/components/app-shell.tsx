import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { Home, Search, Bot, Upload, User, Settings, LogOut, Menu, Flame } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/ai-chat", label: "AI Chat", icon: Bot },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/games", label: "Knowledge Streak", icon: Flame },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to as string}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-sidebar-foreground hover:bg-sidebar-accent",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchProfile(),
  });

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="glass sticky top-0 z-40 flex h-16 items-center justify-between border-b px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <div className="mb-6"><Logo /></div>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <Button variant="ghost" onClick={handleSignOut} className="mt-4 w-full justify-start gap-3">
                <LogOut className="size-4" /> Logout
              </Button>
            </SheetContent>
          </Sheet>
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/profile">
            <Avatar className="size-9 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-hero text-white text-xs">
                {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-8">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-60 shrink-0 md:block">
          <NavList />
          <Button variant="ghost" onClick={handleSignOut} className="mt-4 w-full justify-start gap-3 text-muted-foreground">
            <LogOut className="size-4" /> Logout
          </Button>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
