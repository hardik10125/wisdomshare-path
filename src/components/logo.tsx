import { GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="flex size-9 items-center justify-center rounded-xl bg-hero text-white shadow-soft group-hover:shadow-glow transition-shadow">
        <GraduationCap className="size-5" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight">
          Wisdom<span className="text-primary">Share</span>
        </span>
      )}
    </Link>
  );
}
