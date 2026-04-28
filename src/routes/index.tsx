import { createFileRoute } from "@tanstack/react-router";
import { ChessGame } from "@/components/ChessGame";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chessunity — A Beautiful Chess Experience" },
      {
        name: "description",
        content:
          "Play chess in your browser with a stunning, theme-aware board, full move history, and a simple computer opponent.",
      },
      { property: "og:title", content: "Chessunity — A Beautiful Chess Experience" },
      {
        property: "og:description",
        content: "Play chess online with a clean, modern board and move history.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 60%)",
        }}
      />

      <TopNav />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-8">
        <section className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Every move is a{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-hero)" }}
            >
              story.
            </span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Play, study, and replay your games on a board crafted for clarity. Switch
            between local two‑player and a relaxed computer opponent.
          </p>
        </section>

        <ChessGame />
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-muted-foreground sm:px-8">
        Built with chess.js &amp; react-chessboard.
      </footer>
    </div>
  );
}
