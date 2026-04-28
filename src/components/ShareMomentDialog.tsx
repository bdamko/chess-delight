import { useState } from "react";
import { Share2 } from "lucide-react";
import { Chessboard } from "react-chessboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  fen: string;
}

const MAX_CAPTION = 240;

export function ShareMomentDialog({ fen }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) {
      toast.error("Sign in required", { description: "Please sign in to share a moment." });
      return;
    }
    const trimmed = caption.trim();
    if (!trimmed) {
      toast.error("Add a caption");
      return;
    }

    setSaving(true);

    const username =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Anonymous";

    const { error: insErr } = await supabase.from("moments").insert({
      user_id: user.id,
      username,
      fen,
      caption: trimmed,
    });

    setSaving(false);

    if (insErr) {
      toast.error("Could not share", { description: insErr.message });
      return;
    }
    toast.success("Shared!", { description: "Your moment is on the feed." });
    setCaption("");
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 rounded-full"
      >
        <Share2 className="h-4 w-4" /> Share moment
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setCaption("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Share to Community</DialogTitle>
            <DialogDescription>
              Share this chess position with a caption for everyone to see.
            </DialogDescription>
          </DialogHeader>

          <div
            className="mx-auto w-full overflow-hidden rounded-xl"
            style={{ background: "var(--board-frame)" }}
          >
            <Chessboard
              position={fen}
              arePiecesDraggable={false}
              boardStyle={{ borderRadius: "0.75rem", overflow: "hidden" }}
              lightSquareStyle={{ backgroundColor: "var(--board-light)" }}
              darkSquareStyle={{ backgroundColor: "var(--board-dark)" }}
              darkSquareNotationStyle={{ color: "var(--board-light)", fontWeight: 600 }}
              lightSquareNotationStyle={{ color: "var(--board-dark)", fontWeight: 600 }}
            />
          </div>

          <div className="space-y-1.5">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
              placeholder="A brilliant fork! How would you continue?"
              rows={3}
              maxLength={MAX_CAPTION}
            />
            <div className="text-right text-xs text-muted-foreground">
              {caption.length}/{MAX_CAPTION}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving || !user || !caption.trim()} className="gap-1.5">
              {saving ? "Posting…" : user ? "Post to Community" : "Sign in to share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
