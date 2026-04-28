import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function GoogleButton() {
  const { user, loading } = useAuth();

  const signIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Sign-in failed", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    toast.success("Signed in", { description: "Welcome to Chessunity." });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
  };

  if (loading) return null;

  if (user) {
    const name =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email ??
      "Player";
    const avatar = user.user_metadata?.avatar_url as string | undefined;
    return (
      <div className="flex items-center gap-2">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-8 w-8 rounded-full border border-border/60 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="gap-1.5 rounded-full"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={signIn}
      className="gap-2 rounded-full border-border/60 bg-card/60 backdrop-blur hover:bg-card transition-colors"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
        />
      </svg>
      <span className="text-sm font-medium">Sign in with Google</span>
    </Button>
  );
}
