import { useCallback, useEffect, useRef, useState } from "react";

export type Difficulty = "easy" | "medium" | "hard";

export const SKILL_LEVELS: Record<Difficulty, number> = {
  easy: 3,
  medium: 10,
  hard: 18,
};

const MOVE_TIME_MS: Record<Difficulty, number> = {
  easy: 200,
  medium: 600,
  hard: 1200,
};

/**
 * Loads Stockfish (WASM, single-threaded lite build) as a Web Worker
 * and exposes a `getBestMove(fen, difficulty)` helper using UCI.
 */
export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<((move: string | null) => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker("/stockfish/stockfish-18-lite-single.js");
    workerRef.current = worker;

    const onMessage = (e: MessageEvent) => {
      const line: string = typeof e.data === "string" ? e.data : e.data?.data ?? "";
      if (!line) return;

      if (line === "uciok") {
        worker.postMessage("isready");
      } else if (line === "readyok") {
        setReady(true);
      } else if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const move = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
        const resolve = resolverRef.current;
        resolverRef.current = null;
        resolve?.(move);
      }
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage("uci");

    return () => {
      worker.removeEventListener("message", onMessage);
      try {
        worker.postMessage("quit");
      } catch {
        // ignore
      }
      worker.terminate();
      workerRef.current = null;
      resolverRef.current = null;
    };
  }, []);

  const getBestMove = useCallback(
    (fen: string, difficulty: Difficulty): Promise<string | null> => {
      const worker = workerRef.current;
      if (!worker) return Promise.resolve(null);

      // If a previous request is pending, abort it.
      if (resolverRef.current) {
        worker.postMessage("stop");
        resolverRef.current(null);
        resolverRef.current = null;
      }

      return new Promise((resolve) => {
        resolverRef.current = resolve;
        worker.postMessage(`setoption name Skill Level value ${SKILL_LEVELS[difficulty]}`);
        worker.postMessage(`position fen ${fen}`);
        worker.postMessage(`go movetime ${MOVE_TIME_MS[difficulty]}`);
      });
    },
    []
  );

  return { ready, getBestMove };
}
