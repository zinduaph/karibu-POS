import nodemailer from 'nodemailer';

export async function sendAdminPasswordResetCode(to, code) {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const port = Number(SMTP_PORT || 587);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM || !Number.isInteger(port)) {
    throw new Error('Password recovery email is not configured. Set the SMTP environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject: 'Your Qick Sale admin password reset code',
    text: `Your Qick Sale password reset code is ${code}. It expires in 10 minutes and can only be used once. If you did not request this, you can ignore this email.`,
    html: `<p>Your Qick Sale password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${code}</p><p>It expires in 10 minutes and can only be used once.</p><p>If you did not request this, you can ignore this email.</p>`,
  });
}
