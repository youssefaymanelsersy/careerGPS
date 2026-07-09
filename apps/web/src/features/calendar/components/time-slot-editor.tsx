"use client";

import { AlertCircleIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { CalendarEvent } from "../types";

type TimeSlotEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  maxHours: number;
  onSave: (eventId: string, startTime: string, endTime: string) => void;
};

function isTimeBefore(a: string, b: string) {
  return a.localeCompare(b) < 0;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function TimeSlotEditor({
  open,
  onOpenChange,
  event,
  maxHours,
  onSave,
}: TimeSlotEditorProps) {
  const [startTime, setStartTime] = useState(event.startTime.slice(0, 5));
  const [endTime, setEndTime] = useState(event.endTime.slice(0, 5));

  const maxMinutes = maxHours * 60;

  const errors = useMemo(() => {
    const errs: { endBeforeStart?: boolean; exceedsMax?: boolean } = {};
    if (!isTimeBefore(startTime, endTime)) {
      errs.endBeforeStart = true;
    }
    if (timeToMinutes(endTime) - timeToMinutes(startTime) > maxMinutes) {
      errs.exceedsMax = true;
    }
    return errs;
  }, [startTime, endTime, maxMinutes]);

  const hasErrors = errors.endBeforeStart || errors.exceedsMax;

  const handleSave = () => {
    if (hasErrors) return;
    onSave(event.id, startTime + ":00", endTime + ":00");
    onOpenChange(false);
  };

  const dateLabel = new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Time for {dateLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={cn(
                "w-32",
                errors.endBeforeStart && "border-destructive"
              )}
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={cn(
                "w-32",
                errors.endBeforeStart && "border-destructive"
              )}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Max duration: {maxHours} hour{maxHours > 1 ? "s" : ""} per day
          </div>
          {errors.endBeforeStart && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircleIcon className="size-3" />
              End time must be after start time
            </p>
          )}
          {errors.exceedsMax && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircleIcon className="size-3" />
              Duration exceeds {maxHours} hour{maxHours > 1 ? "s" : ""} limit
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button onClick={handleSave} disabled={hasErrors}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
