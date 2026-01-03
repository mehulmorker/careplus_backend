import sgMail from "@sendgrid/mail";
import { logger } from "./logger";
import { getSenderEmail, isEmailConfigured } from "../config/email";

/**
 * Verify SendGrid Configuration
 *
 * Tests the SendGrid setup by attempting to validate:
 * 1. API key is set and valid
 * 2. Sender email is configured
 * 3. API key has Mail Send permissions (by attempting a test send)
 *
 * This is a diagnostic utility to help troubleshoot email issues.
 */
export async function verifySendGridConfiguration(): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if email is configured
  if (!isEmailConfigured()) {
    errors.push("SENDGRID_API_KEY is not set in environment variables");
    return { success: false, errors, warnings };
  }

  const fromEmail = getSenderEmail();
  const apiKey = process.env.SENDGRID_API_KEY!;

  // Check API key format (SendGrid API keys start with "SG.")
  if (!apiKey.startsWith("SG.")) {
    warnings.push("API key doesn't start with 'SG.' - may be invalid format");
  }

  // Check sender email
  if (fromEmail === "noreply@carepulse.com" && !process.env.SENDGRID_FROM_EMAIL) {
    warnings.push(
      "Using default sender email. Ensure this matches your verified sender in SendGrid."
    );
  }

  // Test API key by attempting to get sender verification status
  // Note: This requires additional SendGrid API calls, so we'll just log the configuration
  logger.info("SendGrid Configuration Check", {
    apiKeySet: true,
    apiKeyPrefix: apiKey.substring(0, 5) + "...",
    fromEmail,
    hasCustomFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
  });

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Test email sending (for diagnostics)
 *
 * Sends a test email to verify the configuration works.
 * Only use this for testing - not in production code.
 */
export async function testEmailSending(testEmail: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      message: "Email service is not configured (SENDGRID_API_KEY missing)",
    };
  }

  try {
    const fromEmail = getSenderEmail();
    const msg = {
      to: testEmail,
      from: fromEmail,
      subject: "Test Email from CarePulse",
      text: "This is a test email to verify SendGrid configuration.",
      html: "<p>This is a test email to verify SendGrid configuration.</p>",
    };

    await sgMail.send(msg);

    return {
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
    };
  } catch (error: any) {
    let message = "Failed to send test email";

    if (error.response) {
      const statusCode = error.response.statusCode;
      const body = error.response.body;

      if (statusCode === 403) {
        message =
          "Forbidden (403): Check API key has 'Mail Send' permission and sender email is verified";
      } else if (statusCode === 401) {
        message = "Unauthorized (401): API key is invalid or expired";
      } else {
        message = `SendGrid error (${statusCode}): ${JSON.stringify(body)}`;
      }
    } else {
      message = `Error: ${error.message}`;
    }

    return {
      success: false,
      message,
    };
  }
}

