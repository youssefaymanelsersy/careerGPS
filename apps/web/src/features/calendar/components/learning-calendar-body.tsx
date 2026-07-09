"use client";

import { getDay, getDaysInMonth, startOfDay } from "date-fns";
import { useMemo } from "react";
import {
  useCalendarMonth,
  useCalendarYear,
} from "@/components/kibo-ui/calendar";
import { cn } from "@/lib/utils";
import type { CalendarEventWithDetails } from "../types";

type LearningCalendarBodyProps = {
  events: CalendarEventWithDetails[];
  onDayClick: (day: number) => void;
  startDay?: number;
};

export function LearningCalendarBody({
  events,
  onDayClick,
  startDay = 0,
}: LearningCalendarBodyProps) {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();
  const today = startOfDay(new Date());

  const currentMonthDate = useMemo(
    () => new Date(year, month, 1),
    [year, month]
  );
  const daysInMonth = useMemo(
    () => getDaysInMonth(currentMonthDate),
    [currentMonthDate]
  );
  const firstDay = useMemo(
    () => (getDay(currentMonthDate) - startDay + 7) % 7,
    [currentMonthDate, startDay]
  );

  const prevMonthData = useMemo(() => {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(
      new Date(prevMonthYear, prevMonth, 1)
    );
    const prevMonthDaysArray = Array.from(
      { length: prevMonthDays },
      (_, i) => i + 1
    );
    return { prevMonthDays, prevMonthDaysArray };
  }, [month, year]);

  const nextMonthData = useMemo(() => {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonthDays = getDaysInMonth(
      new Date(nextMonthYear, nextMonth, 1)
    );
    const nextMonthDaysArray = Array.from(
      { length: nextMonthDays },
      (_, i) => i + 1
    );
    return { nextMonthDaysArray };
  }, [month, year]);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEventWithDetails[]>();
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
    for (const ev of events) {
      if (ev.event.date.startsWith(prefix)) {
        const day = parseInt(ev.event.date.slice(prefix.length), 10);
        const existing = map.get(day) ?? [];
        existing.push(ev);
        map.set(day, existing);
      }
    }
    return map;
  }, [events, year, month]);

  const dayNodes = useMemo(() => {
    const nodes: {
      day: number;
      type: "prev" | "current" | "next";
    }[] = [];

    for (let i = 0; i < firstDay; i++) {
      const day =
        prevMonthData.prevMonthDaysArray[
          prevMonthData.prevMonthDays - firstDay + i
        ];
      if (day) {
        nodes.push({ day, type: "prev" });
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      nodes.push({ day, type: "current" });
    }

    const remainingDays = 7 - ((firstDay + daysInMonth) % 7);
    if (remainingDays < 7) {
      for (let i = 0; i < remainingDays; i++) {
        const day = nextMonthData.nextMonthDaysArray[i];
        if (day) {
          nodes.push({ day, type: "next" });
        }
      }
    }

    return nodes;
  }, [firstDay, daysInMonth, prevMonthData, nextMonthData]);

  return (
    <div className="grid flex-grow grid-cols-7 text-[10px] sm:text-xs">
      {dayNodes.map((node, index) => {
        const dayEvents = node.type === "current" ? eventsByDay.get(node.day) : undefined;
        const hasEvents = !!dayEvents && dayEvents.length > 0;
        const scheduledCount = dayEvents?.filter((e) => e.event.status === "scheduled").length ?? 0;
        const isPastDay =
          node.type === "current" &&
          startOfDay(new Date(year, month, node.day)) < today;

        if (isPastDay) {
          return (
            <div
              key={node.day}
              className="relative aspect-square overflow-hidden border-t border-e bg-secondary p-0.5 sm:p-1"
              style={{
                borderInlineEnd: index % 7 === 6 ? "none" : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs leading-none text-muted-foreground">
                  {node.day}
                </span>
                {hasEvents && (
                  <span className="mt-0.5 block h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </div>
              {hasEvents && (
                <div className="mt-1">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {dayEvents!.length}
                  </span>
                </div>
              )}
            </div>
          );
        }

        if (node.type !== "current") {
          return (
            <div
              key={`${node.type}-${index}`}
              className="relative aspect-square overflow-hidden border-t border-e bg-secondary p-0.5 sm:p-1 text-muted-foreground text-xs"
              style={{
                borderInlineEnd: index % 7 === 6 ? "none" : undefined,
              }}
            >
              {node.day}
            </div>
          );
        }

        return (
          <div
            key={node.day}
            className={cn(
              "relative aspect-square overflow-hidden border-t border-e cursor-pointer transition-colors p-0.5 sm:p-1",
              hasEvents && "bg-blue-50 dark:bg-blue-950/40",
              !hasEvents && "hover:bg-muted"
            )}
            style={{
              borderInlineEnd: index % 7 === 6 ? "none" : undefined,
            }}
            onClick={() => onDayClick(node.day)}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  "text-xs leading-none",
                  hasEvents
                    ? "font-medium text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
                )}
              >
                {node.day}
              </span>
            </div>
            {hasEvents && (
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {scheduledCount > 0 ? `${scheduledCount} session${scheduledCount > 1 ? "s" : ""}` : `${dayEvents!.length} done`}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
