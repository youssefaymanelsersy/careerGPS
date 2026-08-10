import { render } from "@react-email/render";
import { VerificationEmail, type VerificationType } from "./verification-template";

export async function renderVerificationEmailHtml(
  type: VerificationType,
  url: string,
): Promise<string> {
  return render(VerificationEmail({ type, url }));
}
