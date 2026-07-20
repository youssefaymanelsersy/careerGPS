import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2, LogOutIcon } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterUI,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DangerZoneSection() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteAccountMutation = useMutation({
    ...trpc.user.deleteAccount.mutationOptions(),
    onSuccess: async () => {
      await authClient.signOut({
        fetchOptions: {
          onResponse: () => {
            navigate("/");
            toast.success("Account successfully deleted");
          },
        },
      });
    },
    onError: () => {
      toast.error("Failed to delete account");
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
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of CareerGPS on this device.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-end border-t pt-4">
          <Button variant="outline" onClick={handleSignOut}>
            <LogOutIcon className="mr-2 size-4" />
            Log out
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteAccountMutation.isPending}
          >
            <Trash2 className="mr-2 size-4" />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to completely delete your account and all associated data?
              This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooterUI>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Delete Account
            </Button>
          </DialogFooterUI>
        </DialogContent>
      </Dialog>
    </div>
  );
}
