/**
 * @fileoverview Email utility module for sending emails via Resend API.
 * Provides a simple interface for sending emails using Resend (free tier: 3000 emails/month).
 * Configured to work with environment variables.
 * @author Tudu Development Team
 * @version 2.0.0
 * @requires resend
 */

import { Resend } from "resend";

/**
 * Sends an email using Resend API.
 * Works perfectly with Render free tier (no SMTP port restrictions).
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
 *   'Welcome to Maraton',
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
 * @requires process.env.RESEND_API_KEY - Resend API key (get from https://resend.com)
 */
async function sendEmail(
  to: string,
  subject: string,
  text: string
): Promise<void> {
  try {
    /**
     * Check if API key is configured
     */
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurada");
    }

    /**
     * Initialize Resend client with API key
     */
    const resend = new Resend(process.env.RESEND_API_KEY);

    /**
     * Send email via Resend API
     * Note: 'from' email must be verified in Resend dashboard
     * For development, you can use: onboarding@resend.dev
     */
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Maraton <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      text: text,
      html: `<p>${text.replace(/\n/g, '<br>')}</p>`,
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      throw new Error(`Error enviando email: ${error.message}`);
    }

    console.log(`📧 Email enviado a ${to} (ID: ${data?.id})`);
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
