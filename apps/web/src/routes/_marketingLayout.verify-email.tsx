import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const preview = searchParams.get("preview") as "loading" | "success" | "error" | null;
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(preview || "idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Password-reset links are safe to auto-handle on load: they don't consume
  // anything server-side, they just stash the token and navigate locally.
  useEffect(() => {
    if (preview) return;
    if (type === "reset_password" && token) {
      sessionStorage.setItem("reset_password_token", token);
      navigate("/reset-password", { replace: true });
    }
  }, [token, type, navigate, preview]);

  // Email verification is deliberately NOT auto-fired on page load.
  // Verification tokens are single-use, and email link scanners (Microsoft
  // Safe Links, Mimecast, Proofpoint, and similar security gateways) pre-visit
  // every link in an email to check for phishing before the user opens it.
  // If we call the verify endpoint automatically here, the scanner burns the
  // token and the real user's click always fails with "link expired" — even
  // though the link was never actually used by them. Requiring an explicit
  // tap avoids that, since scanners fetch URLs but don't interact with pages.
  const verify = async () => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Authentication token is missing or invalid.");
      return;
    }

    setStatus("loading");
    try {
      const { data, error } = await authClient.verifyEmail({ query: { token } });
      if (!error) {
        setStatus("success");
        setTimeout(() => {
          navigate("/roadmap", { replace: true });
        }, 1500);
      } else {
        setStatus("error");
        setErrorMessage(error.message || "Verification failed. The authorization link may have expired.");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("An unexpected network error occurred during verification.");
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center p-6 bg-muted/20">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="text-center pb-4 pt-8">
          <CardTitle className="text-2xl font-medium tracking-tight">
            {type === "reset_password" ? "Secure Password Reset" : "Account Verification"}
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {status === "idle" && type !== "reset_password" && "One more step"}
            {status === "loading" && "Authenticating your credentials..."}
            {status === "success" && "Authorization confirmed"}
            {status === "error" && "Authorization failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 min-h-[180px]">
          {status === "idle" && type !== "reset_password" && (
            <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500">
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                Tap below to confirm your email address and finish setting up your account.
              </p>
              <Button onClick={verify} variant="default" className="w-full">
                Verify Email Address
              </Button>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
              <div className="relative flex items-center justify-center w-12 h-12">
                <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin duration-1000"></div>
                <div className="absolute inset-2 bg-primary/10 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                <CheckCircle2 className="size-6" strokeWidth={2.5} />
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                Your identity has been verified successfully. Redirecting you to your secure dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                <XCircle className="size-6" strokeWidth={2.5} />
              </div>
              <p className="text-sm text-center text-destructive font-medium max-w-[280px]">
                {errorMessage}
              </p>
              <Button onClick={() => navigate("/login")} variant="default" className="mt-4 w-full">
                Return to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}