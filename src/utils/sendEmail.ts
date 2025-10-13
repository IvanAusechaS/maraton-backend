/**
 * @fileoverview Email utility module for sending emails via SMTP.
 * Provides a simple interface for sending emails using nodemailer with HTML support.
 * Configured to work with environment variables for SMTP settings.
 * @author Tudu Development Team
 * @version 1.0.0
 * @requires nodemailer
 */

import nodemailer from "nodemailer";

/**
 * Sends an email using SMTP configuration from environment variables.
 * Creates a transporter instance and sends both text and HTML versions of the email.
 *
 * @async
 * @function sendEmail
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} text - Email content in plain text format
 * @returns {Promise<void>} Resolves when email is sent successfully
 * @throws {Error} Throws error if email sending fails
 *
 * @example
 * // Send a simple email
 * await sendEmail(
 *   'user@example.com',
 *   'Welcome to Tudu',
 *   'Thank you for signing up!'
 * );
 *
 * @example
 * // Send password reset email
 * const resetUrl = 'https://app.com/reset/token123';
 * await sendEmail(
 *   'user@example.com',
 *   'Password Reset',
 *   `Click here to reset your password: ${resetUrl}`
 * );
 *
 * @requires process.env.SMTP_HOST - SMTP server hostname
 * @requires process.env.SMTP_PORT - SMTP server port number
 * @requires process.env.SMTP_USER - SMTP authentication username
 * @requires process.env.SMTP_PASS - SMTP authentication password
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  try {
    /**
     * Create SMTP transporter with environment configuration.
     * Uses TLS encryption (secure: false with STARTTLS).
     * @type {nodemailer.Transporter}
     */
    const transporter: nodemailer.Transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    } as nodemailer.TransportOptions);

    /**
     * Email options configuration.
     * Includes both plain text and HTML versions for better compatibility.
     * @type {nodemailer.SendMailOptions}
     */
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Maraton Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: `<p>${text}</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado a ${to}`);
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    throw new Error("No se pudo enviar el correo");
  }
}

/**
 * Export the sendEmail function as the main module export.
 * @module sendEmail
 * @type {Function}
 */
export default sendEmail;
