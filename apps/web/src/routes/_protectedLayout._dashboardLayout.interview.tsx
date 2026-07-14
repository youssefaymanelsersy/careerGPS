import { Outlet, useParams } from "react-router-dom";
import { InterviewSetupPage } from "@/features/interview/components/interview-setup-page";

export default function InterviewRoute() {
  const { sessionId } = useParams<{ sessionId: string }>();

  if (sessionId) {
    return <Outlet />;
  }

  return <InterviewSetupPage />;
}
