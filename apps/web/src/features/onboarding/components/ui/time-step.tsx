import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { StepperNext, StepperPrev } from "@/components/ui/stepper";

interface TimeStepProps {
  initialHours?: number;
  initialDays?: number;
  onComplete: (hoursPerDay: number, daysPerWeek: number) => void;
}

export function TimeStep({
  initialHours = 4,
  initialDays = 5,
  onComplete,
}: TimeStepProps) {
  const [hoursPerDay, setHoursPerDay] = useState(initialHours);
  const [daysPerWeek, setDaysPerWeek] = useState(initialDays);

  const handleChangeHours = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? (value[0] ?? hoursPerDay) : value;
    setHoursPerDay(v);
    onComplete(v, daysPerWeek);
  };

  const handleChangeDays = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? (value[0] ?? daysPerWeek) : value;
    setDaysPerWeek(v);
    onComplete(hoursPerDay, v);
  };

  return (
    <Card className="w-full max-w-xl mx-auto h-125 flex flex-col">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          Time Commitment
        </CardTitle>
        <CardDescription className="text-center">
          How much time can you dedicate to learning?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-8">
        <div className="flex-1 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Hours per day</label>
              <span className="text-2xl font-bold tabular-nums">
                {hoursPerDay}
              </span>
            </div>
            <Slider
              value={[hoursPerDay]}
              onValueChange={handleChangeHours}
              min={1}
              max={24}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1h</span>
              <span>24h</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Days per week</label>
              <span className="text-2xl font-bold tabular-nums">
                {daysPerWeek}
              </span>
            </div>
            <Slider
              value={[daysPerWeek]}
              onValueChange={handleChangeDays}
              min={1}
              max={7}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 day</span>
              <span>7 days</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 p-4">
            <Clock className="size-5 text-muted-foreground" />
            <p className="text-center text-sm text-muted-foreground">
              I can commit{" "}
              <span className="font-medium text-foreground">{hoursPerDay} hours/day</span>
              {" "}across{" "}
              <span className="font-medium text-foreground">{daysPerWeek} days/week</span>
            </p>
          </div>
        </div>

      </CardContent>
      <CardFooter className="justify-between">
        <StepperPrev render={<Button variant="secondary" />}>Previous Step</StepperPrev>
        <StepperNext render={<Button />}>Next Step</StepperNext>
      </CardFooter>
    </Card>
  );
}
