import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface MoveHistoryProps {
  history: string[];
  currentPly: number;
}

export function MoveHistory({ history, currentPly }: MoveHistoryProps) {
  const rows: { num: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      num: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between border-b border-border/50 px-5 py-4">
        <h2 className="font-display text-lg font-semibold tracking-tight">Move History</h2>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">
          {history.length} {history.length === 1 ? "ply" : "plies"}
        </span>
      </div>
      <ScrollArea className="flex-1">
        {rows.length === 0 ? (
          <div className="flex h-40 items-center justify-center px-5 text-sm text-muted-foreground">
            The board awaits your opening move.
          </div>
        ) : (
          <ol className="divide-y divide-border/40">
            {rows.map((row) => (
              <li
                key={row.num}
                className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2 px-5 py-2.5 text-sm transition-colors hover:bg-secondary/50"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {row.num}.
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    currentPly === (row.num - 1) * 2 + 1 && "rounded bg-accent/30 px-1.5 py-0.5 font-semibold"
                  )}
                >
                  {row.white ?? ""}
                </span>
                <span
                  className={cn(
                    "font-mono tabular-nums text-muted-foreground",
                    currentPly === (row.num - 1) * 2 + 2 && "rounded bg-accent/30 px-1.5 py-0.5 font-semibold text-foreground"
                  )}
                >
                  {row.black ?? ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </ScrollArea>
    </div>
  );
}
