import { useEffect, useState, useCallback } from "react";
import { History, Loader2, Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GameRow {
  id: string;
  pgn: string;
  result: string;
  played_at: string;
}

interface MyGamesProps {
  refreshKey?: number;
}

const RESULT_LABELS: Record<string, string> = {
  white_win: "White wins",
  black_win: "Black wins",
  draw: "Draw",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MyGames({ refreshKey = 0 }: MyGamesProps) {
  const { user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setGames([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("id, pgn, result, played_at")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(10);
    if (!error && data) setGames(data as GameRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold tracking-tight">My Games</h2>
        </div>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          Last {games.length || 10}
        </span>
      </div>
      <ScrollArea className="flex-1">
        {authLoading ? null : !user ? (
          <div className="flex h-32 items-center justify-center px-5 text-center text-sm text-muted-foreground">
            Sign in to save and review your games.
          </div>
        ) : loading ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="flex h-32 items-center justify-center px-5 text-center text-sm text-muted-foreground">
            No completed games yet. Finish one to see it here.
          </div>
        ) : (
          <ol className="divide-y divide-border/40">
            {games.map((g) => (
              <li key={g.id} className="px-5 py-3 transition-colors hover:bg-secondary/50">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                    {RESULT_LABELS[g.result] ?? g.result}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(g.played_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 font-mono text-xs text-muted-foreground">
                  {g.pgn || "—"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </ScrollArea>
    </div>
  );
}
