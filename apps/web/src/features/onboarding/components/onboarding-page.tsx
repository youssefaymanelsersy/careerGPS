import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleComplete = async () => {
    try {
      await authClient.updateUser({ isOnboarded: true });
      toast.success("Onboarding complete!");
      navigate("/profile", { replace: true });
    } catch (error) {
      toast.error("Failed to complete onboarding");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Welcome, {session?.user.name}!
          </CardTitle>
          <CardDescription className="text-center">
            Complete your onboarding to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Setup your profile to access the full dashboard experience.
          </p>
          <Button onClick={handleComplete}>
            Complete Onboarding
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
