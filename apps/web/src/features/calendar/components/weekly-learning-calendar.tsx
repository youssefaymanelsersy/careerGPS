"use client";

import { RefreshCwIcon, BellIcon, BellOffIcon, CalendarDaysIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import {
  CalendarProvider,
  CalendarDate,
  CalendarDatePicker,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  CalendarHeader,
  useCalendarMonth,
  useCalendarYear,
} from "@/components/kibo-ui/calendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useUserInfo,
  useActiveRole,
  useCalendarEvents,
  useGenerateCalendar,
  useUpdateEvent,
  useStudyNotifications,
} from "../service";
import { CalendarSetup } from "./calendar-setup";
import { LearningCalendarBody } from "./learning-calendar-body";
import { TimeSlotEditor } from "./time-slot-editor";

function CalendarInner() {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();

  const { data: userInfo, isLoading: userLoading } = useUserInfo() as any;
  const { data: activeRole, isLoading: roleLoading } = useActiveRole() as any;
  const hasAvailability = !!(userInfo?.availableDaysPerWeek && userInfo?.availableHoursPerDay);

  const [needsSetup, setNeedsSetup] = useState(false);

  const {
    data: calendarData,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useCalendarEvents(month, year) as any;

  const generateCalendar = useGenerateCalendar() as any;
  const updateEvent = useUpdateEvent() as any;
  const { requestPermission, isSupported, permission } = useStudyNotifications();

  const [selectedDayEvents, setSelectedDayEvents] = useState<any[] | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const handleSetupComplete = () => {
    setNeedsSetup(false);
    refetchEvents();
  };

  const handleDayClick = (day: number) => {
    if (!calendarData?.events) return;
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = calendarData.events.filter((e: any) => e.event.date === dayStr);
    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
    }
  };

  const handleMarkStatus = (eventId: string, status: string) => {
    updateEvent.mutate({ eventId, status });
  };

  const handleEditEvent = (eventWithDetails: any) => {
    setEditingEvent(eventWithDetails);
    setSelectedDayEvents(null);
  };

  const handleSaveTimeSlots = (eventId: string, startTime: string, endTime: string) => {
    updateEvent.mutate({ eventId, startTime, endTime });
    setEditingEvent(null);
  };

  const handleRegenerate = () => {
    generateCalendar.mutate(undefined, {
      onSuccess: () => refetchEvents(),
    });
  };

  const handleToggleNotifications = async () => {
    if (permission === "default") {
      await requestPermission();
    }
  };

  if (userLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <RefreshCwIcon className="size-5 animate-spin" />
      </div>
    );
  }

  if (!hasAvailability || needsSetup) {
    return <CalendarSetup onComplete={handleSetupComplete} />;
  }

  if (!activeRole) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <CalendarDaysIcon className="size-12 text-muted-foreground/40" />
        <div>
          <h3 className="font-medium">No active roadmap</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your onboarding to set a career goal and generate a study plan.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/onboarding"}>
          Go to Onboarding
        </Button>
      </div>
    );
  }

  const needsNewSchedule = calendarData?.needsNewSchedule ?? false;

  return (
    <>
      <CalendarDate>
        <CalendarDatePicker>
          <CalendarMonthPicker />
          <CalendarYearPicker start={2024} end={2030} />
          <CalendarDatePagination />
        </CalendarDatePicker>
        <div className="flex items-center gap-2">
          {isSupported && (
            <Button
              variant={permission === "granted" ? "default" : "outline"}
              size="sm"
              onClick={handleToggleNotifications}
              title={
                permission === "denied"
                  ? "Notifications blocked in browser settings"
                  : "Toggle study reminders"
              }
            >
              {permission === "granted" ? (
                <BellIcon className="size-4" />
              ) : (
                <BellOffIcon className="size-4" />
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={generateCalendar.isPending}
          >
            <RefreshCwIcon className={`size-4 ${generateCalendar.isPending ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </CalendarDate>

      <CalendarHeader />

      <LearningCalendarBody
        events={calendarData?.events ?? []}
        onDayClick={handleDayClick}
      />

      {needsNewSchedule && (
        <div className="flex items-center justify-center gap-2 border-t p-4">
          <SparklesIcon className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            No upcoming schedule.{' '}
            <button
              onClick={handleRegenerate}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Generate one
            </button>
          </span>
        </div>
      )}

      <Dialog
        open={!!selectedDayEvents}
        onOpenChange={(open) => {
          if (!open) setSelectedDayEvents(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDayEvents?.[0]?.event.date
                ? new Date(selectedDayEvents[0].event.date + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "long", day: "numeric" }
                  )
                : ""}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <div className="flex flex-col gap-3">
              {selectedDayEvents?.map(({ event, nodeTitle }: any) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{nodeTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.startTime.slice(0, 5)} - {event.endTime.slice(0, 5)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Session {event.sessionIndex} of {event.totalSessionsForNode}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        event.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : event.status === "skipped"
                            ? "bg-muted text-muted-foreground"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                  {event.status === "scheduled" && (
                    <div className="flex gap-2">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleEditEvent({ event, nodeTitle, nodeDescription: "" })}
                      >
                        Edit time
                      </Button>
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => handleMarkStatus(event.id, "completed")}
                      >
                        Complete
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleMarkStatus(event.id, "skipped")}
                      >
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editingEvent && (
        <TimeSlotEditor
          open={!!editingEvent}
          onOpenChange={(open) => {
            if (!open) setEditingEvent(null);
          }}
          event={editingEvent.event}
          maxHours={userInfo?.availableHoursPerDay ?? 2}
          onSave={handleSaveTimeSlots}
        />
      )}
    </>
  );
}

export function WeeklyLearningCalendar() {
  return (
    <CalendarProvider locale="en-US" startDay={0}>
      <Card>
        <CalendarInner />
      </Card>
    </CalendarProvider>
  );
}
