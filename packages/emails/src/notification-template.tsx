import * as React from "react";
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Section,
  Button,
  Heading,
  Hr,
} from "@react-email/components";

export type NotificationType =
  | "session_reminder"
  | "streak_at_risk"
  | "session_missed"
  | "schedule_empty"
  | "milestone_node_complete"
  | "streak_milestone"
  | "streak_broken"
  | "streak_frozen";

export interface NotificationEmailProps {
  type: NotificationType;
  payload?: any;
}

export function getNotificationSubject(type: NotificationType, payload?: any): string {
  switch (type) {
    case "session_reminder":
      return `Reminder: Your study session starts at ${payload?.startTime || "soon"}`;
    case "streak_at_risk":
      return "Don't break your streak! Action required today";
    case "session_missed":
      return "You missed a study session";
    case "schedule_empty":
      return "Your schedule is empty for next week";
    case "milestone_node_complete":
      return "Congratulations on completing a curriculum node!";
    case "streak_milestone":
      return `Amazing! You've hit a ${payload?.streak || "new"} day streak`;
    case "streak_broken":
      return "Oh no! Your streak was broken";
    case "streak_frozen":
      return "Your streak has been frozen for the day";
    default:
      return "CareerGPS Update";
  }
}

export const NotificationEmail = ({
  type,
  payload,
}: NotificationEmailProps) => {
  let headline = "";
  let message = "";
  let accentColor = "#000000"; // default dark primary

  switch (type) {
    case "session_reminder":
      headline = "Session Reminder";
      message = `You have a study session scheduled on ${payload?.date || "today"} starting at ${payload?.startTime || "soon"}. Get ready to learn${payload?.roadmapTitle ? ` for your ${payload.roadmapTitle} roadmap` : ""}!`;
      accentColor = "#2563eb"; // blue
      break;
    case "streak_at_risk":
      headline = "Streak at Risk!";
      message = `Your streak is at risk of breaking today (${payload?.date || "today"}). Log in and complete a session to keep it going.`;
      accentColor = "#dc2626"; // red
      break;
    case "session_missed":
      headline = "Session Missed";
      message = `You've missed ${payload?.missedCount || "a"} study session(s)${payload?.roadmapTitles ? ` across ${payload.roadmapTitles.join(", ")}` : (payload?.roadmapTitle ? ` for your ${payload.roadmapTitle} roadmap` : "")}. Don't worry, you can always catch up!`;
      accentColor = "#eab308"; // yellow/orange
      break;
    case "schedule_empty":
      headline = "Schedule Empty";
      message = "Your schedule is currently empty. Plan some study sessions to keep making progress.";
      accentColor = "#0f172a"; // slate-900
      break;
    case "milestone_node_complete":
      headline = "Node Completed!";
      message = `Great job! You've successfully completed a curriculum node. Keep up the momentum!`;
      accentColor = "#16a34a"; // green
      break;
    case "streak_milestone":
      headline = "Streak Milestone!";
      message = `Incredible! You've reached a ${payload?.streak || "new"} day learning streak. Be proud of your consistency.`;
      accentColor = "#9333ea"; // purple
      break;
    case "streak_broken":
      headline = "Streak Broken";
      message = `Unfortunately, your streak was broken on ${payload?.day || "recently"}. Every day is a new opportunity to start fresh.`;
      accentColor = "#475569"; // slate-600
      break;
    case "streak_frozen":
      headline = "Streak Frozen";
      message = `Your streak was frozen for ${payload?.day || "the day"}. It will be waiting for you when you return.`;
      accentColor = "#3b82f6"; // light blue
      break;
    default:
      headline = "CareerGPS Notification";
      message = "You have a new update in your account.";
      break;
  }

  return (
    <Html>
      <Head>
        <style>
          {`
            body {
              background-color: #ffffff;
            }
          `}
        </style>
      </Head>
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection(accentColor)}>
            <Text style={logoText}>CareerGPS</Text>
          </Section>
          <Section style={contentSection}>
            <Heading style={title(accentColor)}>{headline}</Heading>
            <Text style={text}>{message}</Text>
            <Button style={button(accentColor)} href="https://app.careergps.space">
              Open CareerGPS
            </Button>
          </Section>
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              You're receiving this because you have notifications enabled for CareerGPS.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: "40px 20px",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
  overflow: "hidden",
  maxWidth: "500px",
};

const headerSection = (color: string) => ({
  backgroundColor: color,
  padding: "24px",
  textAlign: "center" as const,
});

const logoText = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  letterSpacing: "-0.5px",
  margin: "0",
};

const contentSection = {
  padding: "32px 32px 40px",
};

const title = (color: string) => ({
  fontSize: "24px",
  lineHeight: "1.3",
  color: color,
  fontWeight: "700",
  textAlign: "center" as const,
  margin: "0 0 16px",
});

const text = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#3f3f46",
  textAlign: "center" as const,
  margin: "0 0 32px",
};

const button = (color: string) => ({
  backgroundColor: color,
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "14px 20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
});

const divider = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const footerSection = {
  padding: "24px",
  backgroundColor: "#fafafa",
};

const footerText = {
  fontSize: "13px",
  color: "#71717a",
  textAlign: "center" as const,
  margin: "0",
};

export default NotificationEmail;
