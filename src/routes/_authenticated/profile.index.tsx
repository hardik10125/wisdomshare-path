import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile } from "@/lib/profile.functions";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile/")({
  component: MyProfileRedirect,
});

function MyProfileRedirect() {
  const meFn = useServerFn(getMyProfile);
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => meFn() });
  if (isLoading) return <AppShell><div className="flex justify-center p-20"><Loader2 className="size-6 animate-spin" /></div></AppShell>;
  if (!data) return <AppShell><p>No profile found. <Link to="/interests" className="text-primary">Set up your profile</Link></p></AppShell>;
  return <Navigate to="/profile/$username" params={{ username: data.username }} replace />;
}
