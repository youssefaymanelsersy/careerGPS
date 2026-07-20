import { type ReactNode, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Loader from "@/components/composites/loader";

interface RequireVerifiedEmailProps {
  children: ReactNode;
}

export function RequireVerifiedEmail({ children }: RequireVerifiedEmailProps) {
  const { data: session, isPending } = authClient.useSession();
  const [isSending, setIsSending] = useState(false);

  if (isPending) {
    return <Loader />;
  }

  if (!session || (!session.user.emailVerified && session.user.systemRole !== "admin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-6">
          <Lock className="w-12 h-12 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Verification Required</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          This feature is restricted to verified users. Please verify your email address to unlock AI-powered tools, interview generation, and personalized roadmaps.
        </p>
        
        <div className="bg-card border rounded-lg p-6 w-full max-w-md shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-left">
            <div className="bg-primary/10 p-2 rounded-md">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Verification Status</p>
              <p className="text-xs text-muted-foreground">Unverified</p>
            </div>
          </div>
          
          <Button
            className="w-full"
            disabled={isSending}
            onClick={async () => {
              try {
                setIsSending(true);
                const result = await authClient.sendVerificationEmail({
                  email: session?.user?.email || "",
                  callbackURL: window.location.href,
                });
                
                if (result.error) {
                  toast.error(result.error.message || "Failed to send verification email");
                  return;
                }
                
                toast.success("Verification email sent! Check your inbox.");
              } catch (err: any) {
                toast.error(err.message || "Failed to send verification email");
              } finally {
                setIsSending(false);
              }
            }}
          >
            {isSending ? "Sending..." : "Resend Verification Email"}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
