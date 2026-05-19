import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import Loader from "@/components/composites/loader";

export default function ProtectedLayout() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      navigate("/login", { replace: true });
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    return null;
  }

  return <Outlet />;
}
