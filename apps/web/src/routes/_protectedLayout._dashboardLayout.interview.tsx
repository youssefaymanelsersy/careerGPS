import { Outlet, useParams } from "react-router";
import { InterviewSetupPage } from "@/features/interview/components/interview-setup-page";
import { RequireVerifiedEmail } from "@/components/composites/require-verified-email";

export default function InterviewRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();

  if (sessionId) {
    return (
      <RequireVerifiedEmail>
        <Outlet />
      </RequireVerifiedEmail>
    );
  }

  return (
    <RequireVerifiedEmail>
      <InterviewSetupPage />
    </RequireVerifiedEmail>
  );
}
