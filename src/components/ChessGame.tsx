import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { Bot, Loader2, RotateCcw, Undo2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoveHistory } from "./MoveHistory";
import { MyGames } from "./MyGames";
import { ShareMomentDialog } from "./ShareMomentDialog";
import { toast } from "sonner";
import { useStockfish, type Difficulty } from "@/hooks/useStockfish";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Mode = "pvp" | "ai";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("pvp");
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [thinking, setThinking] = useState(false);
  const [gamesRefresh, setGamesRefresh] = useState(0);
  const { ready: engineReady, getBestMove } = useStockfish();
  const { user } = useAuth();
  const savedRef = useRef<string | null>(null);

  const sync = useCallback((g: Chess) => {
    setFen(g.fen());
    setHistory(g.history());
  }, []);

  const persistGame = useCallback(
    async (g: Chess) => {
      if (!user) return;
      const fenKey = g.fen();
      if (savedRef.current === fenKey) return;
      savedRef.current = fenKey;

      let result: "white_win" | "black_win" | "draw";
      if (g.isCheckmate()) {
        // Side to move is checkmated => other side won
        result = g.turn() === "w" ? "black_win" : "white_win";
      } else if (g.isDraw() || g.isStalemate()) {
        result = "draw";
      } else {
        return;
      }

      const { error } = await supabase.from("games").insert({
        user_id: user.id,
        pgn: g.pgn(),
        result,
      });
      if (error) {
        toast.error("Could not save game", { description: error.message });
        savedRef.current = null;
      } else {
        setGamesRefresh((n) => n + 1);
      }
    },
    [user]
  );

  const turn = game.turn() === "w" ? "White" : "Black";
  const inCheck = game.inCheck();
  const isOver = game.isGameOver();

  const status = useMemo(() => {
    if (game.isCheckmate()) return `Checkmate — ${turn === "White" ? "Black" : "White"} wins`;
    if (game.isStalemate()) return "Stalemate";
    if (game.isDraw()) return "Draw";
    if (mode === "ai" && thinking) return "Stockfish is thinking…";
    if (inCheck) return `${turn} is in check`;
    return `${turn} to move`;
  }, [game, turn, inCheck, mode, thinking]);

  // Stockfish AI: ask the engine for the best move at the chosen skill level.
  useEffect(() => {
    if (mode !== "ai") return;
    if (isOver) return;
    if (game.turn() !== "b") return;
    if (!engineReady) return;

    let cancelled = false;
    setThinking(true);
    const currentFen = game.fen();

    getBestMove(currentFen, difficulty)
      .then((uci) => {
        if (cancelled || !uci) return;
        const next = new Chess(currentFen);
        // UCI move: e.g. "e7e5" or "e7e8q" for promotion.
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci.slice(4, 5) : undefined;
        try {
          const move = next.move({ from, to, promotion });
          if (!move) return;
          setGame(next);
          sync(next);
          if (next.isCheckmate()) {
            toast.success("Checkmate!", { description: "Stockfish wins." });
            persistGame(next);
          } else if (next.isDraw()) {
            toast("Draw", { description: "The game ended in a draw." });
            persistGame(next);
          }
        } catch {
          // ignore invalid move
        }
      })
      .finally(() => {
        if (!cancelled) setThinking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fen, mode, game, isOver, sync, engineReady, difficulty, getBestMove, persistGame]);

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
      if (!targetSquare || isOver) return false;
      if (mode === "ai" && game.turn() === "b") return false;
      const next = new Chess(game.fen());
      try {
        const move = next.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
        if (!move) return false;
        setGame(next);
        sync(next);
        if (next.isCheckmate()) {
          toast.success("Checkmate!", { description: `${move.color === "w" ? "White" : "Black"} wins.` });
          persistGame(next);
        } else if (next.isDraw()) {
          toast("Draw", { description: "The game ended in a draw." });
          persistGame(next);
        }
        return true;
      } catch {
        return false;
      }
    },
    [game, isOver, mode, sync, persistGame]
  );

  const reset = () => {
    const fresh = new Chess();
    setGame(fresh);
    sync(fresh);
    savedRef.current = null;
    toast("New game", { description: "Pieces reset to starting position." });
  };

  const undo = () => {
    const next = new Chess(game.fen());
    next.undo();
    if (mode === "ai" && next.turn() === "b") next.undo(); // also undo AI
    setGame(next);
    sync(next);
  };

  const flip = () => setOrientation((o) => (o === "white" ? "black" : "white"));

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* Board panel */}
      <div className="rounded-3xl border border-border/60 bg-[var(--gradient-surface)] p-5 shadow-[var(--shadow-elegant)] sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
            >
              {mode === "ai" ? "Vs Computer" : "Two Players"}
            </Badge>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {mode === "ai" && thinking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={undo}
              disabled={history.length === 0 || thinking}
              className="gap-1.5"
            >
              <Undo2 className="h-4 w-4" /> Undo
            </Button>
            <Button variant="ghost" size="sm" onClick={flip} className="gap-1.5">
              <RotateCcw className="h-4 w-4" /> Flip
            </Button>
            <Button variant="default" size="sm" onClick={reset} className="rounded-full">
              New game
            </Button>
          </div>
        </div>

        <div
          className="mx-auto rounded-2xl p-3 sm:p-4"
          style={{
            background: "var(--board-frame)",
            boxShadow: "var(--shadow-board)",
            maxWidth: "min(100%, 640px)",
          }}
          id="chessboard-capture"
        >
          <Chessboard
            options={{
              position: fen,
              boardOrientation: orientation,
              onPieceDrop,
              animationDurationInMs: 200,
              boardStyle: { borderRadius: "0.75rem", overflow: "hidden" },
              lightSquareStyle: { backgroundColor: "var(--board-light)" },
              darkSquareStyle: { backgroundColor: "var(--board-dark)" },
              darkSquareNotationStyle: { color: "var(--board-light)", fontWeight: 600 },
              lightSquareNotationStyle: { color: "var(--board-dark)", fontWeight: 600 },
            }}
          />
        </div>

        <div className="mt-5 flex justify-center gap-2">
          <Button
            variant={mode === "pvp" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("pvp")}
            className="gap-1.5 rounded-full"
          >
            <Users className="h-4 w-4" /> Pass &amp; play
          </Button>
          <Button
            variant={mode === "ai" ? "default" : "outline"}
            size="sm"
            onClick={() => switchMode("ai")}
            className="gap-1.5 rounded-full"
          >
            <Bot className="h-4 w-4" /> Vs computer
          </Button>
        </div>

        {mode === "ai" && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Difficulty
            </span>
            <div className="flex gap-1 rounded-full border border-border/60 bg-card/60 p-1 backdrop-blur">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={difficulty === d ? "default" : "ghost"}
                  onClick={() => setDifficulty(d)}
                  disabled={thinking}
                  className="h-7 rounded-full px-3 text-xs"
                >
                  {DIFFICULTY_LABELS[d]}
                </Button>
              ))}
            </div>
            {!engineReady && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading engine…
              </span>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-center">
          <ShareMomentDialog fen={fen} />
        </div>
      </div>

      {/* Sidebar: history + saved games */}
      <aside className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-elegant)] lg:max-h-[40vh]">
          <MoveHistory history={history} currentPly={history.length} />
        </div>
        <div className="rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-elegant)] lg:max-h-[40vh]">
          <MyGames refreshKey={gamesRefresh} />
        </div>
      </aside>
    </div>
  );
}
