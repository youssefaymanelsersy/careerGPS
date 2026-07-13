import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import Loader from "@/components/composites/loader";
import { OnboardingPage } from "@/features/onboarding/components/onboarding-page";

export default function OnboardingRoute() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session?.user.isOnboarded) {
      navigate("/roadmap", { replace: true });
    }
  }, [session, isPending, navigate]);

  if (isPending) {
    return <Loader />;
  }

  if (session?.user.isOnboarded) {
    return <Loader />;
  }

  return <OnboardingPage />;
}
