import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useUserInfo, useSetAvailability, useGenerateCalendar } from "@/features/calendar/service";
import Loader from "@/components/composites/loader";
import { Field, FieldLabel } from "@/components/ui/field";

export function StudyPreferencesSection() {
  const { data: user, isLoading } = useUserInfo();
  const setAvailability = useSetAvailability();
  const generateCalendar = useGenerateCalendar();

  const form = useForm({
    defaultValues: {
      availableDaysPerWeek: user?.availableDaysPerWeek ?? 5,
      availableHoursPerDay: user?.availableHoursPerDay ?? 2,
      preferredStartTime: user?.preferredStartTime ?? "18:00:00",
      timezone: user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    onSubmit: async ({ value }) => {
      try {
        await setAvailability.mutateAsync(value);
        toast.success("Settings saved successfully!");

        // Ask if they want to regenerate the calendar
        toast("Regenerate schedule?", {
          description: "Would you like to apply these new preferences to your upcoming schedule immediately?",
          action: {
            label: "Yes, regenerate",
            onClick: () => {
              generateCalendar.mutate(undefined, {
                onSuccess: () => toast.success("Calendar regenerated based on new preferences!"),
                onError: () => toast.error("Failed to regenerate calendar."),
              });
            },
          },
          cancel: {
            label: "Maybe later",
            onClick: () => {},
          },
        });
      } catch (error) {
        toast.error("Failed to save settings.");
      }
    },
  });

  if (isLoading || !user) return <Loader />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Preferences</CardTitle>
        <CardDescription>
          Configure how you want CareerGPS to generate your upcoming study schedule.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="availableDaysPerWeek">
            {(field) => (
              <Field>
                <FieldLabel>Days per week</FieldLabel>
                <Select
                  value={field.state.value.toString()}
                  onValueChange={(val) => field.handleChange(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="availableHoursPerDay">
            {(field) => (
              <Field>
                <FieldLabel>Hours per day</FieldLabel>
                <Select
                  value={field.state.value.toString()}
                  onValueChange={(val) => field.handleChange(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} hours
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="preferredStartTime">
            {(field) => (
              <Field>
                <FieldLabel>Preferred Start Time</FieldLabel>
                <Input
                  type="time"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  When would you ideally like to start your study sessions?
                </p>
              </Field>
            )}
          </form.Field>

          <form.Field name="timezone">
            {(field) => (
              <Field>
                <FieldLabel>Timezone</FieldLabel>
                <Input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your timezone is automatically detected by your browser.
                </p>
              </Field>
            )}
          </form.Field>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button
          type="submit"
          form="settings-form"
          disabled={setAvailability.isPending}
          className="w-full sm:w-auto"
        >
          {setAvailability.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
