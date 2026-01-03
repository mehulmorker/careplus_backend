import sgMail, { MailDataRequired } from "@sendgrid/mail";
import { getSenderEmail, isEmailConfigured } from "../config/email";
import { logger } from "../utils/logger";

/**
 * Email Service Interface
 */
export interface IEmailService {
  sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean>;
  sendAppointmentConfirmation(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string
  ): Promise<boolean>;
  sendAppointmentScheduled(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string
  ): Promise<boolean>;
  sendAppointmentCancelled(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string,
    reason?: string
  ): Promise<boolean>;
}

/**
 * Email Service Implementation
 *
 * Handles all email operations using SendGrid.
 * Provides methods for sending appointment-related emails.
 */
export class EmailService implements IEmailService {
  private readonly fromEmail: string;

  constructor() {
    this.fromEmail = getSenderEmail();
  }

  /**
   * Send a generic email
   *
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param html - HTML content
   * @param text - Plain text content (optional)
   * @returns true if email sent successfully, false otherwise
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    if (!isEmailConfigured()) {
      logger.warn("Email service not configured. Skipping email send.", { to, subject });
      return false;
    }

    try {
      const msg: MailDataRequired = {
        to,
        from: this.fromEmail,
        subject,
        html,
        ...(text && { text }),
      };

      await sgMail.send(msg);
      return true;
    } catch (error: any) {
      // Enhanced error logging for SendGrid errors
      const errorDetails: any = {
        to,
        subject,
        from: this.fromEmail,
      };

      if (error.response) {
        // SendGrid API error response
        errorDetails.statusCode = error.response.statusCode;
        errorDetails.body = error.response.body;
        errorDetails.message = error.message;

        // Provide specific guidance based on error
        if (error.response.statusCode === 403) {
          const errorBody = error.response.body;
          const errors = errorBody?.errors || [];
          
          // Check for specific "from address" error
          const fromAddressError = errors.find((e: any) => 
            e.message?.includes("from address does not match") || 
            e.message?.includes("Sender Identity")
          );
          
          if (fromAddressError) {
            logger.error("SendGrid Error: From address does not match verified Sender Identity", {
              ...errorDetails,
              errorMessage: fromAddressError.message,
            });
          } else {
            logger.error("SendGrid Forbidden Error", errorDetails);
          }
        } else {
          logger.error("Failed to send email", errorDetails);
        }
      } else {
        logger.error("Failed to send email", { error: error.message || error, ...errorDetails });
      }

      return false;
    }
  }

  /**
   * Send appointment confirmation email
   *
   * Sent when a patient creates a new appointment (status: PENDING)
   *
   * @param to - Patient email address
   * @param patientName - Patient's name
   * @param appointmentDate - Appointment date/time
   * @param doctorName - Doctor's name
   * @returns true if email sent successfully
   */
  async sendAppointmentConfirmation(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string
  ): Promise<boolean> {
    const { subject, html, text } = generateAppointmentConfirmationEmail(
      patientName,
      appointmentDate,
      doctorName
    );

    return this.sendEmail(to, subject, html, text);
  }

  /**
   * Send appointment scheduled email
   *
   * Sent when admin schedules an appointment (status: SCHEDULED)
   *
   * @param to - Patient email address
   * @param patientName - Patient's name
   * @param appointmentDate - Appointment date/time
   * @param doctorName - Doctor's name
   * @returns true if email sent successfully
   */
  async sendAppointmentScheduled(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string
  ): Promise<boolean> {
    const { subject, html, text } = generateAppointmentScheduledEmail(
      patientName,
      appointmentDate,
      doctorName
    );

    return this.sendEmail(to, subject, html, text);
  }

  /**
   * Send appointment cancellation email
   *
   * Sent when an appointment is cancelled
   *
   * @param to - Patient email address
   * @param patientName - Patient's name
   * @param appointmentDate - Appointment date/time
   * @param doctorName - Doctor's name
   * @param reason - Cancellation reason (optional)
   * @returns true if email sent successfully
   */
  async sendAppointmentCancelled(
    to: string,
    patientName: string,
    appointmentDate: Date,
    doctorName: string,
    reason?: string
  ): Promise<boolean> {
    const { subject, html, text } = generateAppointmentCancelledEmail(
      patientName,
      appointmentDate,
      doctorName,
      reason
    );

    return this.sendEmail(to, subject, html, text);
  }
}

/**
 * Generate appointment confirmation email content
 */
function generateAppointmentConfirmationEmail(
  patientName: string,
  appointmentDate: Date,
  doctorName: string
): { subject: string; html: string; text: string } {
  const formattedDate = appointmentDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = "Appointment Request Received - CarePulse";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Request Received</h1>
        </div>
        <div class="content">
          <p>Dear ${patientName},</p>
          <p>Thank you for requesting an appointment with CarePulse. We have received your request and will confirm it shortly.</p>
          
          <div class="details">
            <h3>Appointment Details:</h3>
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Status:</strong> Pending Confirmation</p>
          </div>
          
          <p>We will notify you once your appointment is confirmed. If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The CarePulse Team</p>
        </div>
        <div class="footer">
          <p>© 2024 CarePulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Appointment Request Received - CarePulse
    
    Dear ${patientName},
    
    Thank you for requesting an appointment with CarePulse. We have received your request and will confirm it shortly.
    
    Appointment Details:
    - Doctor: Dr. ${doctorName}
    - Date & Time: ${formattedDate}
    - Status: Pending Confirmation
    
    We will notify you once your appointment is confirmed. If you have any questions, please don't hesitate to contact us.
    
    Best regards,
    The CarePulse Team
    
    © 2024 CarePulse. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Generate appointment scheduled email content
 */
function generateAppointmentScheduledEmail(
  patientName: string,
  appointmentDate: Date,
  doctorName: string
): { subject: string; html: string; text: string } {
  const formattedDate = appointmentDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = "Appointment Confirmed - CarePulse";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .highlight { background-color: #E3F2FD; padding: 10px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Appointment Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${patientName},</p>
          <p>Great news! Your appointment has been confirmed.</p>
          
          <div class="details">
            <h3>Confirmed Appointment Details:</h3>
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          
          <div class="highlight">
            <p><strong>Please arrive 15 minutes early for your appointment.</strong></p>
          </div>
          
          <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          <p>We look forward to seeing you!</p>
          <p>Best regards,<br>The CarePulse Team</p>
        </div>
        <div class="footer">
          <p>© 2024 CarePulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Appointment Confirmed - CarePulse
    
    Dear ${patientName},
    
    Great news! Your appointment has been confirmed.
    
    Confirmed Appointment Details:
    - Doctor: Dr. ${doctorName}
    - Date & Time: ${formattedDate}
    - Status: Confirmed
    
    Please arrive 15 minutes early for your appointment.
    
    If you need to reschedule or cancel, please contact us at least 24 hours in advance.
    
    We look forward to seeing you!
    
    Best regards,
    The CarePulse Team
    
    © 2024 CarePulse. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Generate appointment cancelled email content
 */
function generateAppointmentCancelledEmail(
  patientName: string,
  appointmentDate: Date,
  doctorName: string,
  reason?: string
): { subject: string; html: string; text: string } {
  const formattedDate = appointmentDate.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const subject = "Appointment Cancelled - CarePulse";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${patientName},</p>
          <p>We regret to inform you that your appointment has been cancelled.</p>
          
          <div class="details">
            <h3>Cancelled Appointment Details:</h3>
            <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          </div>
          
          <p>If you would like to schedule a new appointment, please visit our website or contact us directly.</p>
          <p>We apologize for any inconvenience this may cause.</p>
          <p>Best regards,<br>The CarePulse Team</p>
        </div>
        <div class="footer">
          <p>© 2024 CarePulse. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Appointment Cancelled - CarePulse
    
    Dear ${patientName},
    
    We regret to inform you that your appointment has been cancelled.
    
    Cancelled Appointment Details:
    - Doctor: Dr. ${doctorName}
    - Date & Time: ${formattedDate}
    ${reason ? `- Reason: ${reason}` : ""}
    
    If you would like to schedule a new appointment, please visit our website or contact us directly.
    
    We apologize for any inconvenience this may cause.
    
    Best regards,
    The CarePulse Team
    
    © 2024 CarePulse. All rights reserved.
  `;

  return { subject, html, text };
}

/**
 * Factory function for creating EmailService
 *
 * @returns EmailService instance
 */
export const createEmailService = (): EmailService => {
  return new EmailService();
};

