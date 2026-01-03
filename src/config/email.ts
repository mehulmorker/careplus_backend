import sgMail from "@sendgrid/mail";
import { logger } from "../utils/logger";

/**
 * Email Configuration
 *
 * Initializes SendGrid with API key from environment variables.
 * Must be called before sending any emails.
 */
export function initializeEmailService(): void {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = getSenderEmail();

  if (!apiKey) {
    logger.warn("SENDGRID_API_KEY not found. Email service will not work.");
    return;
  }

  sgMail.setApiKey(apiKey);
  logger.info("SendGrid email service initialized", { fromEmail });
  
  // Warn if using default email
  if (fromEmail === "noreply@carepulse.com" && !process.env.SENDGRID_FROM_EMAIL) {
    logger.warn("Using default sender email. Set SENDGRID_FROM_EMAIL to match your verified sender in SendGrid.");
  }
}

/**
 * Get sender email from environment
 *
 * @returns Sender email address
 */
export function getSenderEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "noreply@carepulse.com";
}

/**
 * Check if email service is configured
 *
 * @returns true if SendGrid API key is set
 */
export function isEmailConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

