import { Link } from "@tanstack/react-router";
import { Crown, Sparkles, Swords } from "lucide-react";
import { GoogleButton } from "@/components/GoogleButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopNav() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
      <Link to="/" className="group flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105"
          style={{ background: "var(--gradient-hero)" }}
        >
          <Crown className="h-5 w-5" />
        </span>
        <span className="font-display text-xl font-bold tracking-tight">Chessunity</span>
      </Link>

      <nav
        className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur sm:flex"
        aria-label="Primary"
      >
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-sm"
        >
          <Swords className="h-4 w-4" /> Play
        </Link>
        <Link
          to="/feed"
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-background data-[status=active]:text-foreground data-[status=active]:shadow-sm"
        >
          <Sparkles className="h-4 w-4" /> Community
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <GoogleButton />
        <ThemeToggle />
      </div>
    </header>
  );
}
