const nodemailer = require('nodemailer')

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const APP_URL = process.env.APP_URL || 'http://localhost:5173'

async function sendVerificationEmail({ to, name, token, email }) {
  const link = `${APP_URL}/verify-registration?email=${encodeURIComponent(email)}&token=${token}`
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Bladder Health Guide" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your account — Bladder Health Guide',
    text: `Hello ${name},\n\nPlease click the link below to verify your email address:\n\n${link}\n\nThis link expires in 15 minutes.\n\nIf you did not register, please ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 36px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h1 style="color: #1a5276; font-size: 24px; margin-bottom: 8px;">Bladder Health Guide</h1>
    <p style="color: #555; font-size: 16px; margin-bottom: 24px;">Verify your account</p>

    <p style="font-size: 20px; color: #1a1a1a;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 18px; color: #1a1a1a;">Thank you for registering. Please click the button below to verify your email address.</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${link}" style="background: #1a5276; color: #fff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-size: 20px; font-weight: 700; display: inline-block;">
        Verify My Email
      </a>
    </div>

    <p style="color: #922b21; font-size: 16px; font-weight: 600;">This link expires in 15 minutes.</p>
    <p style="color: #555; font-size: 14px;">If you did not register for the Bladder Health Guide, please ignore this email.</p>
  </div>
</body>
</html>`,
  })
}

async function sendLoginEmail({ to, name, token }) {
  const transporter = createTransport()
  await transporter.sendMail({
    from: `"Bladder Health Guide" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your sign-in word — Bladder Health Guide',
    text: `Hello ${name},\n\nYour sign-in word is:\n\n${token}\n\nEnter this word in the app to sign in.\n\nThis word expires in 15 minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
<!DOCTYPE html>
<html lang="en">
<body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 36px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h1 style="color: #1a5276; font-size: 24px; margin-bottom: 8px;">Bladder Health Guide</h1>
    <p style="color: #555; font-size: 16px; margin-bottom: 24px;">Sign in to your account</p>

    <p style="font-size: 20px; color: #1a1a1a;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 18px; color: #1a1a1a;">Your sign-in word is:</p>

    <div style="background: #eaf3fb; border: 3px solid #2e86c1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-size: 42px; font-weight: 900; letter-spacing: 0.2em; color: #1a5276; font-family: 'Courier New', monospace;">${token}</span>
    </div>

    <p style="font-size: 18px; color: #1a1a1a;">Enter this word in the app to sign in.</p>
    <p style="color: #922b21; font-size: 16px; font-weight: 600;">This word expires in 15 minutes.</p>
    <p style="color: #555; font-size: 14px;">If you did not request this sign-in word, please ignore this email.</p>
  </div>
</body>
</html>`,
  })
}

module.exports = { sendVerificationEmail, sendLoginEmail }
