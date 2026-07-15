import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Single, unified mail transmission engine
async function sendMailEngine({ to, subject, text, html, logLabel = 'Email' }) {
  console.log('--------------------------------------------------');
  console.log(`[sendEmail] Sending ${logLabel} to ${to}`);
  console.log(`[sendEmail] Subject: ${subject}`);
  console.log('--------------------------------------------------');

  try {
    let nodemailer;
    try {
      nodemailer = await import('nodemailer');
    } catch {
      // not installed
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
        to,
        subject,
        text,
        html,
      });
      console.log(`[sendEmail] ${logLabel} successfully sent to ${to} via SMTP.`);
    } else {
      console.log(`[sendEmail] SMTP credentials not set or nodemailer not installed. Printed to console.`);
    }
  } catch (error) {
    console.error(`[sendEmail] Failed to process ${logLabel} send:`, error.message);
  }
}

// Verification OTP email helper
export async function verificationEmail(email, otp_code) {
  const subject = "Verify your email";
  const text = `Your verification code is ${otp_code}`;
  try {
    const templatePath = path.join(__dirname, 'templates', 'verificationEmail.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    htmlContent = htmlContent.replace('{{OTP_CODE}}', otp_code);
    
    await sendMailEngine({
      to: email,
      subject,
      text,
      html: htmlContent,
      logLabel: 'Verification Email'
    });
  } catch (error) {
    console.error('[sendEmail] Verification template render failed:', error.message);
  }
}

// Personal account registration email helper
async function registerPersonalEmail(email, password, name, admin_name) {
  const subject = "Your RepoSync Personal User Account Credentials";
  const text = `Welcome to RepoSync. An account has been created for you by ${admin_name}. Email: ${email}, Password: ${password}`;
  try {
    const templatePath = path.join(__dirname, 'templates', 'registrationEmail.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    const loginUrl = `${config.frontendUrl}/login`;
    htmlContent = htmlContent
      .replace(/{{USER_NAME}}/g, name)
      .replace(/{{USER_EMAIL}}/g, email)
      .replace(/{{USER_PASSWORD}}/g, password)
      .replace(/{{ADMIN_NAME}}/g, admin_name)
      .replace(/{{LOGIN_URL}}/g, loginUrl);
      
    await sendMailEngine({
      to: email,
      subject,
      text,
      html: htmlContent,
      logLabel: 'Registration Email'
    });
  } catch (error) {
    console.error('[sendEmail] Registration template render failed:', error.message);
  }
}

const sendEmail = {
  verificationEmail,
  registerPersonalEmail
};

export default sendEmail;
