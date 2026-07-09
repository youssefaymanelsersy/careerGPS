"use client";

import { useState } from "react";
import { Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useSetAvailability, useGenerateCalendar } from "../service";

type CalendarSetupProps = {
  onComplete: () => void;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6];

export function CalendarSetup({ onComplete }: CalendarSetupProps) {
  const [hours, setHours] = useState(2);
  const [days, setDays] = useState(5);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);

  const setAvailability = useSetAvailability() as any;
  const generateCalendar = useGenerateCalendar() as any;
  const isPending = setAvailability.isPending || generateCalendar.isPending;

  const toggleWeekday = (dayIndex: number) => {
    setWeekdays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSubmit = async () => {
    try {
      await setAvailability.mutateAsync({
        availableDaysPerWeek: days,
        availableHoursPerDay: hours,
        availableWeekdays: weekdays,
      });
      await generateCalendar.mutateAsync();
      onComplete();
    } catch {
      // error toast handled by trpc
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Set Your Study Schedule</CardTitle>
        <CardDescription>
          Tell us about your availability so we can generate a personalized study calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Hours per day</span>
            <span className="text-sm font-bold">{hours} hrs</span>
          </div>
          <Slider
            value={[hours]}
            min={1}
            max={8}
            step={1}
            onValueChange={(v: any) => setHours(v[0])}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>1 hr</span>
            <span>8 hrs</span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Days per week</span>
            <span className="text-sm font-bold">{days} days</span>
          </div>
          <Slider
            value={[days]}
            min={1}
            max={7}
            step={1}
            onValueChange={(v: any) => setDays(v[0])}
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>1 day</span>
            <span>7 days</span>
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">Which days?</span>
          <div className="flex gap-1.5">
            {DAY_INDICES.map((dayIndex) => (
              <button
                key={dayIndex}
                type="button"
                onClick={() => toggleWeekday(dayIndex)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  weekdays.includes(dayIndex)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {DAY_LABELS[dayIndex].charAt(0)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span>Your study sessions will be scheduled in the evening by default.</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isPending || weekdays.length === 0}
        >
          {isPending ? (
            <>
              <CalendarDays className="size-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <CalendarDays className="size-4" />
              Generate Calendar
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
