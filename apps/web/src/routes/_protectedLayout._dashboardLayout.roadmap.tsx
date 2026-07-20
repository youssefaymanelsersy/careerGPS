import { RoadmapPage } from "../features/roadmap/RoadmapPage";
import { RequireVerifiedEmail } from "@/components/composites/require-verified-email";

export default function RoadmapRoute() {
  return (
    <RequireVerifiedEmail>
      <RoadmapPage />
    </RequireVerifiedEmail>
  );
}