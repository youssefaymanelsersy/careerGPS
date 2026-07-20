import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CalendarDays, Copy, Check, Info } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { env } from "@careergps/env/web";
import { toast } from "sonner";

export function CalendarSyncModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    ...trpc.calendar.getSyncToken.queryOptions(),
    enabled: open,
  });

  const syncUrl = data?.token ? `${env.VITE_SERVER_URL}/calendar/feed/${data.token}.ics` : "";

  const handleCopy = async () => {
    if (!syncUrl) return;
    try {
      await navigator.clipboard.writeText(syncUrl);
      setCopied(true);
      toast.success("Calendar URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-expect-error - asChild type clash in older shadcn */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarDays className="size-4" />
          Sync Calendar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync with External Calendar</DialogTitle>
          <DialogDescription>
            Subscribe to your learning schedule from Google Calendar, Apple Calendar, or Outlook.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Your Calendar URL</label>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={isLoading ? "Loading..." : error ? "Error loading token" : syncUrl}
                className="font-mono text-xs"
              />
              <Button 
                type="button" 
                size="icon" 
                variant="secondary" 
                className="shrink-0" 
                onClick={handleCopy}
                disabled={!syncUrl}
              >
                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <h4 className="mb-2 font-medium flex items-center gap-2">
              <Info className="size-4 text-blue-500" />
              How to connect
            </h4>
            <ul className="space-y-2 text-muted-foreground list-disc pl-4">
              <li>
                <strong>Google Calendar:</strong> Go to Settings &gt; Add calendar &gt; From URL. Paste the link and click Add Calendar.
              </li>
              <li>
                <strong>Apple Calendar:</strong> Go to File &gt; New Calendar Subscription. Paste the link and click Subscribe.
              </li>
              <li>
                <strong>Outlook:</strong> Go to Add Calendar &gt; Subscribe from web. Paste the link and click Import.
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Note: External calendars sync automatically, but Google Calendar may take up to 12-24 hours to reflect new changes made here.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
