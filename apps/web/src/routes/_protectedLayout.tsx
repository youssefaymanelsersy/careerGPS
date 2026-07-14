import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet, useLocation } from "react-router";
import Loader from "@/components/composites/loader";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ProtectedLayout() {
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!session.user.isOnboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {!session.user.emailVerified && (
        <div className="bg-amber-100 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3 sm:flex sm:items-center sm:justify-between shrink-0">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Please verify your email address. You won't be able to receive login until you do.
            </p>
          </div>
          <div className="mt-3 sm:ml-4 sm:mt-0 sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-black border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/50"
              onClick={async () => {
                await authClient.sendVerificationEmail({
                  email: session.user.email,
                  callbackURL: "/roadmap",
                });
                toast.success("Verification email sent! Check your inbox.");
              }}
            >
              Resend verification email
            </Button>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
