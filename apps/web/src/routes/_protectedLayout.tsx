import { authClient } from "@/lib/auth-client";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useEffect } from "react";
import Loader from "@/components/composites/loader";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, isPending, navigate]);

  useEffect(() => {
    if (
      !isPending &&
      session &&
      !session.user.isOnboarded &&
      location.pathname !== "/onboarding"
    ) {
      navigate("/onboarding", { replace: true });
    }
  }, [session, isPending, navigate, location.pathname]);

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return null;
  }

  return <Outlet />;
}
