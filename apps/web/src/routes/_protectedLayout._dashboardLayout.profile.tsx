import { authClient } from "@/lib/auth-client";
import Loader from "@/components/composites/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Mail } from "lucide-react";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  // TODO: build actual profile page

  return (
    <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            Profile
          </CardTitle>
          <CardDescription className="text-center">
            Your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session?.user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session?.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
