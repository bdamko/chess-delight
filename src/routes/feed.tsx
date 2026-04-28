import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { Chessboard } from "react-chessboard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Community Moments — Chessunity" },
      {
        name: "description",
        content:
          "A feed of memorable chess moments shared by the Chessunity community.",
      },
      { property: "og:title", content: "Community Moments — Chessunity" },
      {
        property: "og:description",
        content: "View and react to chess positions shared by the community.",
      },
    ],
  }),
  component: FeedPage,
});

interface Moment {
  id: string;
  username: string;
  fen: string;
  caption: string;
  likes: number;
  created_at: string;
}

interface Comment {
  id: string;
  moment_id: string;
  username: string;
  body: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function FeedPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      return new Set(JSON.parse(localStorage.getItem("liked-moments") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("moments")
        .select("id, username, fen, caption, likes, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!active) return;
      if (error) toast.error("Could not load feed", { description: error.message });
      else setMoments((data as Moment[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const like = async (id: string) => {
    if (liked.has(id)) return;
    setMoments((ms) => ms.map((m) => (m.id === id ? { ...m, likes: m.likes + 1 } : m)));
    const next = new Set(liked);
    next.add(id);
    setLiked(next);
    try {
      localStorage.setItem("liked-moments", JSON.stringify(Array.from(next)));
    } catch {
      /* noop */
    }
    const { error } = await supabase.rpc("increment_moment_likes", { moment_id: id });
    if (error) {
      setMoments((ms) =>
        ms.map((m) => (m.id === id ? { ...m, likes: Math.max(0, m.likes - 1) } : m))
      );
      toast.error("Could not like", { description: error.message });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--accent) 25%, transparent), transparent 60%)",
        }}
      />
      <TopNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-4 sm:px-8">
        <section className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Community Moments
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Chess positions worth sharing.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Brilliant tactics, sacrifices, and memorable moments shared by the community.
          </p>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : moments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No moments yet. Play a game and share the first position!
            </p>
          </div>
        ) : (
          <ul className="grid gap-6">
            {moments.map((m) => (
              <MomentCard
                key={m.id}
                moment={m}
                liked={liked.has(m.id)}
                onLike={() => like(m.id)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function MomentCard({
  moment,
  liked,
  onLike,
}: {
  moment: Moment;
  liked: boolean;
  onLike: () => void;
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const username = useMemo(() => {
    if (!user) return null;
    return (
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Anonymous"
    );
  }, [user]);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && comments === null) {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from("moment_comments")
        .select("id, moment_id, username, body, created_at")
        .eq("moment_id", moment.id)
        .order("created_at", { ascending: true });
      setLoadingComments(false);
      if (error) {
        toast.error("Could not load comments", { description: error.message });
        setComments([]);
      } else {
        setComments((data as Comment[]) ?? []);
      }
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username) return;
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("moment_comments")
      .insert({
        moment_id: moment.id,
        user_id: user.id,
        username,
        body,
      })
      .select("id, moment_id, username, body, created_at")
      .single();
    setPosting(false);
    if (error) {
      toast.error("Could not post comment", { description: error.message });
      return;
    }
    setComments((c) => [...(c ?? []), data as Comment]);
    setDraft("");
  };

  return (
    <li className="flex flex-col rounded-3xl border border-border/60 bg-[var(--gradient-surface)] p-5 shadow-[var(--shadow-elegant)]">
      <div
        className="overflow-hidden rounded-2xl"
        style={{ background: "var(--board-frame)" }}
      >
        <Chessboard
          position={moment.fen}
          arePiecesDraggable={false}
          boardStyle={{ borderRadius: "0.75rem", overflow: "hidden" }}
          lightSquareStyle={{ backgroundColor: "var(--board-light)" }}
          darkSquareStyle={{ backgroundColor: "var(--board-dark)" }}
          darkSquareNotationStyle={{ color: "var(--board-light)", fontWeight: 600 }}
          lightSquareNotationStyle={{ color: "var(--board-dark)", fontWeight: 600 }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="font-semibold">{moment.username}</span>
        <span className="text-xs text-muted-foreground">{timeAgo(moment.created_at)}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{moment.caption}</p>

      <div className="mt-4 flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          disabled={liked}
          className="gap-1.5 rounded-full"
          aria-label="Like moment"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current text-primary" : ""}`} />
          <span className="tabular-nums">{moment.likes}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="gap-1.5 rounded-full"
          aria-expanded={expanded}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{expanded ? "Hide" : "Comments"}</span>
        </Button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border/60 pt-4">
          {loadingComments ? (
            <div className="flex justify-center py-4 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (comments?.length ?? 0) === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No comments yet — be the first.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments!.map((c) => (
                <li key={c.id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">{c.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{c.body}</p>
                </li>
              ))}
            </ul>
          )}

          {user ? (
            <form onSubmit={submit} className="mt-4 flex items-center gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add a comment…"
                maxLength={500}
                disabled={posting}
              />
              <Button
                type="submit"
                size="sm"
                disabled={posting || !draft.trim()}
                className="gap-1.5 rounded-full"
              >
                {posting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          ) : (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Sign in to comment.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
