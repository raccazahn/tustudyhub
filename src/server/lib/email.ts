import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'tustudyhub@gmail.com',
    pass: process.env.EMAIL_PASS || '',
  },
});

export async function sendPasswordResetEmail(email: string, userName: string, token: string) {
  // HARDCODED to bypass Windows localhost resolution issues
  const resetLink = `http://127.0.0.1:3000/#/reset-password?token=${token}`;

  const mailOptions = {
    from: `"TuStudyHub" <${process.env.EMAIL_USER || 'tustudyhub@gmail.com'}>`,
    to: email,
    subject: 'Reset Your Password - TuStudyHub',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">

          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #8A3E12 0%, #A84D16 100%); padding: 40px 30px; text-align: center;">
              <div style="display: inline-flex; align-items: center; justify-content: center; background-color: #ffffff; border-radius: 50%; width: 64px; height: 64px; margin-bottom: 16px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#8A3E12"/>
                  <path d="M2 17L12 22L22 17" stroke="#8A3E12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="#8A3E12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">TuStudyHub</h1>
              <p style="margin: 8px 0 0 0; color: #F7E4D0; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;">ACADEMIC RESOURCE MANAGEMENT</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="margin: 0 0 24px 0; color: #1C1A17; font-size: 24px; font-weight: 700;">Reset Your Password</h2>

              <p style="margin: 0 0 16px 0; color: #4A463F; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>

              <p style="margin: 0 0 32px 0; color: #4A463F; font-size: 16px; line-height: 1.6;">
                We received a request to reset the password for your TuStudyHub account. Click the button below to create a new secure password.
              </p>

              <!-- Reset Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8A3E12 0%, #A84D16 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(138, 62, 18, 0.3); transition: transform 0.2s;">
                      Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; color: #726B62; font-size: 14px; line-height: 1.6;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>

              <div style="margin-top: 40px; padding: 20px; background-color: #F7F5F1; border-left: 4px solid #8A3E12; border-radius: 4px;">
                <p style="margin: 0; color: #4A463F; font-size: 14px; line-height: 1.6;">
                  <strong>Didn't request this?</strong><br>
                  If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF8F5; padding: 30px 40px; text-align: center; border-top: 1px solid #EDE9E2;">
              <p style="margin: 0 0 8px 0; color: #726B62; font-size: 13px; line-height: 1.6;">
                This is an automated message from TuStudyHub. Please do not reply to this email.
              </p>
              <p style="margin: 0; color: #726B62; font-size: 12px; font-weight: 600;">
                © 2026 TuStudyHub. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    console.error('⚠️ [EMAIL] Network blocked SMTP. Dev fallback link:');
    console.error(`http://127.0.0.1:3000/#/reset-password?token=${token}`);
  }
}
