export type CalendarEventStatus = "scheduled" | "completed" | "skipped";

export type CalendarEvent = {
  id: string;
  userId: string;
  roadmapNodeId: string;
  sessionIndex: number;
  totalSessionsForNode: number;
  date: string;
  startTime: string;
  endTime: string;
  status: CalendarEventStatus;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventWithDetails = {
  event: CalendarEvent;
  nodeTitle: string;
  nodeDescription: string;
};

export type GetCalendarResponse = {
  events: CalendarEventWithDetails[];
  needsNewSchedule: boolean;
};

export type GenerateResponse = {
  success: boolean;
  count: number;
  events: CalendarEvent[];
};

export type SetAvailabilityInput = {
  availableDaysPerWeek: number;
  availableHoursPerDay: number;
  availableWeekdays?: number[];
};
