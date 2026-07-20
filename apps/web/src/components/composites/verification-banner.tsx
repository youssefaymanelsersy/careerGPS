import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function VerificationBanner() {
  const { data: session } = authClient.useSession();
  const [isSending, setIsSending] = useState(false);

  if (!session || session.user.emailVerified || session.user.systemRole === "admin") {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-500/5 border-b border-amber-200 dark:border-amber-500/30 px-4 py-3 sm:flex sm:items-center sm:justify-between shrink-0">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-3 shrink-0" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Verify your email to unlock AI-powered features.
        </p>
      </div>
      <div className="mt-3 sm:ml-4 sm:mt-0 sm:shrink-0">
        <Button
          variant="outline"
          size="sm"
          disabled={isSending}
          className="bg-white dark:bg-black border-amber-300 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10"
          onClick={async () => {
            try {
              setIsSending(true);
              const result = await authClient.sendVerificationEmail({
                email: session.user.email,
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
          {isSending ? "Sending..." : "Resend verification email"}
        </Button>
      </div>
    </div>
  );
}
