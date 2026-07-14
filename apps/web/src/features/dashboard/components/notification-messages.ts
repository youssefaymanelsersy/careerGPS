export type NotificationType =
  | "session_reminder"
  | "streak_at_risk"
  | "session_missed"
  | "schedule_empty"
  | "milestone_node_complete"
  | "streak_milestone"
  | "streak_broken"
  | "streak_frozen";

export function getNotificationMessage(type: NotificationType, payload?: any): string {
  switch (type) {
    case "session_reminder":
      return `Session starting on ${payload?.date || "today"} at ${payload?.startTime || "soon"}.`;
    case "streak_at_risk":
      return `Your streak is at risk today (${payload?.date || "today"}). Complete a session to keep it going!`;
    case "session_missed":
      return `You missed ${payload?.missedCount || "a"} study session(s). Catch up soon!`;
    case "schedule_empty":
      return "Your schedule is empty for next week. Time to plan!";
    case "milestone_node_complete":
      return "You completed a curriculum node! Keep up the great work.";
    case "streak_milestone":
      return `Amazing! You've hit a ${payload?.streak || "new"} day streak.`;
    case "streak_broken":
      return `Your streak was broken on ${payload?.day || "recently"}. Don't give up!`;
    case "streak_frozen":
      return `Your streak has been frozen for ${payload?.day || "today"}.`;
    default:
      return "You have a new notification.";
  }
}
