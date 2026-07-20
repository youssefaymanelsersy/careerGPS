import { CvBuilderLayout } from "../features/cv-builder/components/CvBuilderLayout";
import { RequireVerifiedEmail } from "@/components/composites/require-verified-email";

export default function CvBuilderRoute() {
  return (
    <RequireVerifiedEmail>
      <CvBuilderLayout />
    </RequireVerifiedEmail>
  );
}

