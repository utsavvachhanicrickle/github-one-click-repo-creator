import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Internal helper for mail sending logic
async function sendMail(email, subject, text, otpCode) {
  console.log('--------------------------------------------------');
  console.log(`[sendEmail] Sending email to ${email}`);
  console.log(`[sendEmail] Subject: ${subject}`);
  console.log(`[sendEmail] OTP: ${otpCode}`);
  console.log('--------------------------------------------------');

  try {
    const templatePath = path.join(__dirname, 'templates', 'verificationEmail.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    htmlContent = htmlContent.replace('{{OTP_CODE}}', otpCode);

    // Dynamic import to attempt using nodemailer
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch {
      // nodemailer not installed
    }

    if (nodemailer && config.smtp.user && config.smtp.pass) {
      const transporter = nodemailer.default.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });

      await transporter.sendMail({
        from: `"RepoSync" <${config.smtp.user}>`,
        to: email,
        subject,
        text,
        html: htmlContent,
      });
      console.log(`[sendEmail] Email successfully sent to ${email} via SMTP Server.`);
    } else {
      console.log(`[sendEmail] SMTP credentials not set or nodemailer not installed. Printed to console above.`);
    }
  } catch (error) {
    console.error('[sendEmail] Failed to process email send:', error.message);
  }
}

// Verification email trigger helper
export async function verificationEmail(email, otp_code) {
  const subject = "Verify your email";
  const text = `Your verification code is ${otp_code}`;
  await sendMail(email, subject, text, otp_code);
}

const sendEmail = {
  verificationEmail
};

export default sendEmail;
