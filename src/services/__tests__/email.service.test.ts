import { describe, it, expect, beforeEach, vi } from "vitest";
import { EmailService } from "../email.service";

// Mock SendGrid
const mockSend = vi.fn();
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

// Mock email config
vi.mock("../../config/email", () => ({
  getSenderEmail: vi.fn(() => "noreply@carepulse.com"),
  isEmailConfigured: vi.fn(() => true),
  initializeEmailService: vi.fn(),
}));

/**
 * Email Service Unit Tests
 *
 * Tests email service functionality:
 * - Email sending
 * - Appointment confirmation emails
 * - Appointment scheduled emails
 * - Appointment cancelled emails
 */
describe("EmailService", () => {
  let emailService: EmailService;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Get mocked SendGrid
    const sgMail = await import("@sendgrid/mail");
    const sendGridMock = sgMail.default as any;
    sendGridMock.send = vi.fn().mockResolvedValue([{} as any, {}]);

    // Get mocked email config
    const emailConfig = await import("../../config/email");
    vi.mocked(emailConfig.isEmailConfigured).mockReturnValue(true);

    // Create service
    emailService = new EmailService();
  });

  describe("sendEmail", () => {
    it("should send email successfully", async () => {
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;

      const result = await emailService.sendEmail(
        "patient@example.com",
        "Test Subject",
        "<p>Test HTML</p>",
        "Test Text"
      );

      expect(result).toBe(true);
      expect(sendGridMock.send).toHaveBeenCalledWith({
        to: "patient@example.com",
        from: "noreply@carepulse.com",
        subject: "Test Subject",
        html: "<p>Test HTML</p>",
        text: "Test Text",
      });
    });

    it("should return false when email service not configured", async () => {
      const emailConfig = await import("../../config/email");
      vi.mocked(emailConfig.isEmailConfigured).mockReturnValueOnce(false);

      const result = await emailService.sendEmail(
        "patient@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      expect(result).toBe(false);
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      expect(sendGridMock.send).not.toHaveBeenCalled();
    });

    it("should return false on SendGrid error", async () => {
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      sendGridMock.send.mockRejectedValueOnce(new Error("SendGrid error"));

      const result = await emailService.sendEmail(
        "patient@example.com",
        "Test Subject",
        "<p>Test HTML</p>"
      );

      expect(result).toBe(false);
    });
  });

  describe("sendAppointmentConfirmation", () => {
    it("should send appointment confirmation email", async () => {
      const appointmentDate = new Date("2025-12-31T10:00:00Z");
      const result = await emailService.sendAppointmentConfirmation(
        "patient@example.com",
        "John Doe",
        appointmentDate,
        "Dr. Smith"
      );

      expect(result).toBe(true);
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      expect(sendGridMock.send).toHaveBeenCalled();
      const callArgs = sendGridMock.send.mock.calls[0][0];
      expect(callArgs.to).toBe("patient@example.com");
      expect(callArgs.subject).toContain("Appointment Request Received");
      expect(callArgs.html).toContain("John Doe");
      expect(callArgs.html).toContain("Dr. Smith");
    });
  });

  describe("sendAppointmentScheduled", () => {
    it("should send appointment scheduled email", async () => {
      const appointmentDate = new Date("2025-12-31T14:00:00Z");
      const result = await emailService.sendAppointmentScheduled(
        "patient@example.com",
        "John Doe",
        appointmentDate,
        "Dr. Smith"
      );

      expect(result).toBe(true);
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      expect(sendGridMock.send).toHaveBeenCalled();
      const callArgs = sendGridMock.send.mock.calls[0][0];
      expect(callArgs.subject).toContain("Appointment Confirmed");
      expect(callArgs.html).toContain("John Doe");
      expect(callArgs.html).toContain("Dr. Smith");
    });
  });

  describe("sendAppointmentCancelled", () => {
    it("should send appointment cancellation email", async () => {
      const appointmentDate = new Date("2025-12-31T10:00:00Z");
      const result = await emailService.sendAppointmentCancelled(
        "patient@example.com",
        "John Doe",
        appointmentDate,
        "Dr. Smith",
        "Urgent meeting"
      );

      expect(result).toBe(true);
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      expect(sendGridMock.send).toHaveBeenCalled();
      const callArgs = sendGridMock.send.mock.calls[0][0];
      expect(callArgs.subject).toContain("Appointment Cancelled");
      expect(callArgs.html).toContain("John Doe");
      expect(callArgs.html).toContain("Urgent meeting");
    });

    it("should send cancellation email without reason", async () => {
      const appointmentDate = new Date("2025-12-31T10:00:00Z");
      const result = await emailService.sendAppointmentCancelled(
        "patient@example.com",
        "John Doe",
        appointmentDate,
        "Dr. Smith"
      );

      expect(result).toBe(true);
      const sgMail = await import("@sendgrid/mail");
      const sendGridMock = sgMail.default as any;
      expect(sendGridMock.send).toHaveBeenCalled();
    });
  });
});
