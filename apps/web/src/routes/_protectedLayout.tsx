import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet, useLocation } from "react-router";
import Loader from "@/components/composites/loader";
import { VerificationBanner } from "@/components/composites/verification-banner";

export default function ProtectedLayout() {
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.user.systemRole === "admin" && location.pathname === "/") {
    return <Navigate to="/admin" replace />;
  }

  if (!session.user.isOnboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <VerificationBanner />
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
