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

export type VerificationType = "verify_email" | "reset_password";

export interface VerificationEmailProps {
  type: VerificationType;
  url: string;
}

export function getVerificationSubject(type: VerificationType): string {
  if (type === "reset_password") return "Reset your password for CareerGPS";
  return "Verify your email address for CareerGPS";
}

export const VerificationEmail = ({ type, url }: VerificationEmailProps) => {
  const isReset = type === "reset_password";
  const headline = isReset ? "Reset Password" : "Verify Email";
  const message = isReset
    ? "Someone recently requested a password change for your CareerGPS account. If this was you, you can set a new password here:"
    : "Welcome to CareerGPS! We're excited to help you achieve your career goals. Please verify your email address to get started.";
  const buttonText = isReset ? "Reset Password" : "Verify Email Address";
  const accentColor = "#0f172a"; // Sleek dark slate

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
            <Button style={button(accentColor)} href={url}>
              {buttonText}
            </Button>
            {isReset && (
              <Text style={subtext}>
                If you didn't request this, you can safely ignore this email.
              </Text>
            )}
          </Section>
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              This link will expire soon. If you need a new one, please request it from the app.
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

const subtext = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#71717a",
  textAlign: "center" as const,
  margin: "24px 0 0",
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

export default VerificationEmail;
