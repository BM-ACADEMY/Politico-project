// utils/Email.js (Corrected)
const nodemailer = require("nodemailer");

// Create transporter (Fixed: createTransport, not createTransporter)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use TLS on port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Email transporter error:", error);
  } else {
    console.log("Email transporter ready");
  }
});

// OTP Email template
const getOtpEmailTemplate = ({ name, otp }) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset OTP</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 20px; background: #f9f9f9; }
      .otp-box { background: #4F46E5; color: white; font-size: 24px; font-weight: bold; padding: 20px; margin: 20px 0; border-radius: 8px; letter-spacing: 5px; }
      .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Politico Password Reset</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>You requested a password reset. Your 6-digit OTP is:</p>
      <div class="otp-box">${otp}</div>
      <p>Enter this OTP to proceed. It expires in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>Politico Team</p>
    </div>
  </body>
</html>
`;

const sendOtpEmail = async ({ email, name, otp }) => {
  // Validate inputs
  if (!email || !name || !otp) {
    throw new Error("Missing required email params: email, name, otp");
  }

  const mailOptions = {
    from: `"Politico" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset OTP",
    html: getOtpEmailTemplate({ name, otp }),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error(`Email send failed: ${error.message}`);
  }
};

module.exports = { sendOtpEmail };