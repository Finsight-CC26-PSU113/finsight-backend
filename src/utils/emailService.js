import nodemailer from 'nodemailer';
import logger from '../config/logger.js';

const hasSmtpConfig = () =>
  Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS
  );

const buildTransport = () => {
  if (!hasSmtpConfig()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const getFromAddress = () =>
  process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@finsight.local';

export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const transport = buildTransport();

  if (!transport) {
    logger.info('SMTP not configured. Password reset link generated for dev use only.', {
      to,
      resetUrl,
    });
    return { emailSent: false };
  }

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject: 'FINSIGHT Password Reset',
    text: `Klik link berikut untuk reset password Anda: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h2 style="margin-bottom: 16px;">Reset Password FINSIGHT</h2>
        <p>Klik link berikut untuk mengatur ulang password Anda:</p>
        <p><a href="${resetUrl}" target="_blank" rel="noreferrer">Reset password</a></p>
        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
      </div>
    `,
  });

  return { emailSent: true };
};
