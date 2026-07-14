import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { env } from "@careergps/env/web";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const preview = searchParams.get("preview") as "loading" | "success" | "error" | null;
  
  const [status, setStatus] = useState<"loading" | "success" | "error">(preview || "loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (preview) return; // Skip verification if preview mode is active

    if (!token) {
      setStatus("error");
      setErrorMessage("Authentication token is missing or invalid.");
      return;
    }

    const verify = async () => {
      try {
        if (type === "reset_password") {
          sessionStorage.setItem("reset_password_token", token);
          navigate("/reset-password", { replace: true });
          return;
        }

        const res = await fetch(`${env.VITE_SERVER_URL}/api/auth/verify-email?token=${token}`);
        if (res.ok || res.redirected) {
          setStatus("success");
          setTimeout(() => {
            navigate("/roadmap", { replace: true });
          }, 1500);
        } else {
          const data = await res.json().catch(() => null);
          setStatus("error");
          setErrorMessage(data?.message || "Verification failed. The authorization link may have expired.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("An unexpected network error occurred during verification.");
      }
    };

    verify();
  }, [token, type, navigate, preview]);

  return (
    <div className="flex flex-1 items-center justify-center p-6 bg-muted/20">
      <Card className="w-full max-w-md shadow-sm border-border">
        <CardHeader className="text-center pb-4 pt-8">
          <CardTitle className="text-2xl font-medium tracking-tight">
            {type === "reset_password" ? "Secure Password Reset" : "Account Verification"}
          </CardTitle>
          <CardDescription className="text-sm mt-2">
            {status === "loading" && "Authenticating your credentials..."}
            {status === "success" && "Authorization confirmed"}
            {status === "error" && "Authorization failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 min-h-[180px]">
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
