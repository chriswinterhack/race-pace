import { Resend } from "resend";

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey && process.env.NODE_ENV === "production") {
  console.warn("RESEND_API_KEY is not set - emails will not be sent");
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender
export const FROM_EMAIL = "FinalClimb <noreply@thefinalclimb.com>";

// Send email with fallback for development
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!resend) {
    console.log("📧 [DEV] Email would be sent:");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body: ${text || html.substring(0, 200)}...`);
    return { success: true, messageId: "dev-mode" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email" };
  }
}
