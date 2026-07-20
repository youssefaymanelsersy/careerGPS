import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { env } from "@careergps/env/web";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, LogOutIcon, PlusIcon } from "lucide-react";

interface AccountSectionProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    emailVerified?: boolean;
  };
}

export function AccountSection({ user }: AccountSectionProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(env.VITE_SERVER_URL + "/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      if (data.url) {
        await authClient.updateUser({ image: data.url });
        toast.success("Profile picture updated");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: "/roadmap",
      });
      toast.success("Verification email sent");
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const nameForm = useForm({
    defaultValues: {
      name: user.name,
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim()) {
        toast.error("Name cannot be empty");
        return;
      }
      try {
        await authClient.updateUser({ name: value.name.trim() });
        toast.success("Name updated");
      } catch (error) {
        toast.error("Failed to update name");
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      try {
        await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });
        toast.success("Password updated");
        passwordForm.reset();
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to update password. Check your current password.");
      }
    },
  });

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onResponse: () => navigate("/"),
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your photo and personal details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative inline-block">
              <Avatar className="size-16">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                type="button"
                className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full border-2 border-background shadow-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Upload profile picture"
              >
                {isUploading ? (
                  <Loader2Icon className="size-3 animate-spin" />
                ) : (
                  <PlusIcon className="size-3" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium">Profile picture</p>
              <p className="text-sm text-muted-foreground">PNG or JPG, up to a few MB.</p>
            </div>
          </div>

          <Separator />

          <form
            id="account-name-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nameForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <nameForm.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel>Full name</FieldLabel>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </nameForm.Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <div className="flex items-center gap-2">
                <Input value={user.email} readOnly className="bg-muted text-muted-foreground" />
                <Badge variant={user.emailVerified ? "success" : "warning"}>
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
              {!user.emailVerified && (
                <FieldDescription>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend verification email"}
                  </button>
                </FieldDescription>
              )}
            </Field>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <nameForm.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="account-name-form" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            )}
          </nameForm.Subscribe>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change the password used to sign in to CareerGPS.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="account-password-form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <Field>
                  <FieldLabel>Current password</FieldLabel>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </passwordForm.Field>
            <passwordForm.Field name="newPassword">
              {(field) => (
                <Field>
                  <FieldLabel>New password</FieldLabel>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldDescription>Must be at least 8 characters.</FieldDescription>
                </Field>
              )}
            </passwordForm.Field>
            <passwordForm.Field name="confirmPassword">
              {(field) => (
                <Field>
                  <FieldLabel>Confirm new password</FieldLabel>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </passwordForm.Field>
          </form>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <passwordForm.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="account-password-form" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update password"}
              </Button>
            )}
          </passwordForm.Subscribe>
        </CardFooter>
      </Card>
    </div>
  );
}
