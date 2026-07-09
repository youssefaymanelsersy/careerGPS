import { authClient } from "@/lib/auth-client";
import { Navigate, Outlet, useLocation } from "react-router";
import Loader from "@/components/composites/loader";

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

  return <Outlet />;
}
