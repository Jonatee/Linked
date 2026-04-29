const PRODUCT_NAME = "Linked";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildWelcomeEmail({ userName, dashboardUrl, supportEmail }) {
  const safeUserName = escapeHtml(userName);
  const safeDashboardUrl = escapeHtml(dashboardUrl);
  const safeSupportEmail = escapeHtml(supportEmail);

  return {
    subject: `Welcome to ${PRODUCT_NAME}`,
    text: `Welcome to ${PRODUCT_NAME}, ${userName}. Start here: ${dashboardUrl}`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${PRODUCT_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding:40px 40px 20px 40px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#E02424 0%,#1a1a1a 100%);width:48px;height:48px;border-radius:4px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" height="100%">
                      <tr>
                        <td align="center" valign="middle" style="color:#ffffff;font-weight:bold;font-size:24px;">L</td>
                      </tr>
                    </table>
                  </td>
                  <td style="padding-left:15px;">
                    <span style="font-size:20px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#1a1a1a;">${PRODUCT_NAME}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 60px;text-align:center;">
              <h1 style="margin:0 0 20px 0;font-size:32px;font-weight:800;line-height:1.2;letter-spacing:-1px;color:#1a1a1a;">Welcome to the feed, ${safeUserName}.</h1>
              <p style="margin:0 0 30px 0;font-size:16px;line-height:1.6;color:#4a4a4a;">
                Thank you for joining <strong>${PRODUCT_NAME}</strong>. Your account has been created successfully. You're now part of a modern space designed for curated conversation and high-fidelity discovery.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${safeDashboardUrl}" target="_blank" style="display:inline-block;background-color:#E02424;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:18px 40px;border-radius:4px;">Start Exploring</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 60px;">
              <hr style="border:0;border-top:1px solid #eeeeee;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px 60px;">
              <h2 style="margin:0 0 20px 0;font-size:18px;font-weight:700;color:#1a1a1a;text-transform:uppercase;letter-spacing:1px;">First Steps</h2>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="top" style="padding-bottom:25px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" style="padding-right:15px;">
                          <div style="background-color:#f4f4f4;width:32px;height:32px;border-radius:4px;line-height:32px;text-align:center;color:#E02424;font-weight:800;">1</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">Complete Your Profile</p>
                          <p style="margin:5px 0 0 0;font-size:14px;color:#666666;">Upload your signature stacked square avatar and set your bio.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="padding-bottom:25px;">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" style="padding-right:15px;">
                          <div style="background-color:#f4f4f4;width:32px;height:32px;border-radius:4px;line-height:32px;text-align:center;color:#E02424;font-weight:800;">2</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">Discover Curators</p>
                          <p style="margin:5px 0 0 0;font-size:14px;color:#666666;">Find people who share your interests and start following.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td valign="top">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td valign="top" style="padding-right:15px;">
                          <div style="background-color:#f4f4f4;width:32px;height:32px;border-radius:4px;line-height:32px;text-align:center;color:#E02424;font-weight:800;">3</div>
                        </td>
                        <td valign="top">
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a1a;">Share Your First Thought</p>
                          <p style="margin:5px 0 0 0;font-size:14px;color:#666666;">Craft your first post and start building your presence.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 60px;background-color:#1a1a1a;color:#888888;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:13px;color:#ffffff;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${PRODUCT_NAME}</p>
              <p style="margin:0 0 20px 0;font-size:13px;line-height:1.5;">
                Need help? Contact our support team at <a href="mailto:${safeSupportEmail}" style="color:#E02424;text-decoration:none;">${safeSupportEmail}</a>.
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#555555;">
                If you didn't create an account with us, please ignore this email.<br />
                &copy; 2026 ${PRODUCT_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

function buildResetPasswordEmail({ userName, resetUrl, resetCode, supportEmail, expirationMinutes = 30 }) {
  const safeUserName = escapeHtml(userName);
  const safeResetUrl = escapeHtml(resetUrl);
  const safeResetCode = escapeHtml(resetCode);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeExpiration = escapeHtml(expirationMinutes);

  return {
    subject: `Reset your ${PRODUCT_NAME} password`,
    text: `Hello ${userName}, reset your ${PRODUCT_NAME} password here: ${resetUrl}\nUse this reset code: ${resetCode}`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Inter',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 40px 20px 40px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#E02424;padding:12px;border-radius:4px;">
                    <div style="width:24px;height:24px;background-color:#ffffff;border-radius:2px;"></div>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:800;color:#131313;letter-spacing:-0.5px;text-transform:uppercase;">${PRODUCT_NAME}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 60px 40px 60px;">
              <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:700;color:#131313;text-align:center;">Reset your password</h1>
              <p style="margin:0 0 24px 0;font-size:16px;line-height:24px;color:#353534;text-align:center;">
                Hello ${safeUserName}, we received a request to reset your ${PRODUCT_NAME} password. Use the code below in the app, or click the button to open the reset screen.
              </p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 10px 0;font-size:13px;color:#9b9b9b;text-transform:uppercase;letter-spacing:1px;">Reset code</p>
                    <table border="0" cellpadding="0" cellspacing="0" bgcolor="#f9f9f9" style="border:1px solid #eeeeee;border-radius:4px;">
                      <tr>
                        <td align="center" style="padding:18px 32px;font-family:'Courier New',Courier,monospace;font-size:30px;font-weight:700;color:#111111;letter-spacing:10px;">
                          ${safeResetCode}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:10px 0 30px 0;">
                    <a href="${safeResetUrl}" target="_blank" style="background-color:#E02424;border:1px solid #E02424;border-radius:4px;color:#ffffff;display:inline-block;font-size:16px;font-weight:600;line-height:50px;text-align:center;text-decoration:none;width:220px;">Open Reset Page</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-size:13px;line-height:20px;color:#a0a0a0;text-align:center;">
                If you're having trouble with the button above, copy and paste the URL below into your web browser:
              </p>
              <p style="margin:0 0 24px 0;font-size:13px;line-height:18px;color:#E02424;text-align:center;word-break:break-all;">
                <a href="${safeResetUrl}" style="color:#E02424;text-decoration:none;">${safeResetUrl}</a>
              </p>
              <hr style="border:none;border-top:1px solid #f0f0f0;margin:30px 0;" />
              <p style="margin:0 0 10px 0;font-size:14px;line-height:22px;color:#353534;font-weight:600;">Important Security Information:</p>
              <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:22px;color:#353534;">
                <li style="margin-bottom:8px;">This link and code will expire in ${safeExpiration} minutes.</li>
                <li>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td style="background-color:#131313;padding:40px 60px;text-align:center;">
              <p style="margin:0 0 16px 0;font-size:12px;line-height:18px;color:#e5e2e1;opacity:0.6;text-transform:uppercase;letter-spacing:1px;">
                ${PRODUCT_NAME}
              </p>
              <p style="margin:0 0 16px 0;font-size:13px;line-height:20px;color:#e5e2e1;">
                Need help? Contact our support team at <a href="mailto:${safeSupportEmail}" style="color:#E02424;text-decoration:none;">${safeSupportEmail}</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:18px;color:#e5e2e1;opacity:0.4;">
                &copy; 2026 ${PRODUCT_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
}

function buildPasswordChangedEmail({ userName, changedAt, securityUrl, supportEmail }) {
  const safeUserName = escapeHtml(userName);
  const safeChangedAt = escapeHtml(changedAt);
  const safeSecurityUrl = escapeHtml(securityUrl);
  const safeSupportEmail = escapeHtml(supportEmail);

  return {
    subject: `${PRODUCT_NAME} password changed`,
    text: `Hello ${userName}, your ${PRODUCT_NAME} password was changed on ${changedAt}.`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Changed - ${PRODUCT_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td align="center" style="padding:40px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff;border:1px solid #eeeeee;">
                    <tr>
                        <td align="center" style="padding:40px 0 20px 0;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td bgcolor="#E02424" style="padding:10px;border-radius:0px;">
                                        <div style="width:30px;height:30px;border:2px solid #ffffff;position:relative;">
                                             <div style="width:100%;height:100%;background:#131313;position:absolute;top:4px;left:4px;z-index:-1;"></div>
                                        </div>
                                    </td>
                                    <td style="padding-left:15px;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:bold;letter-spacing:-1px;color:#131313;text-transform:uppercase;">
                                        ${PRODUCT_NAME}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 60px;">
                            <h1 style="margin:0 0 20px 0;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:bold;color:#131313;text-align:center;">
                                Your password was changed
                            </h1>
                            <p style="margin:0 0 30px 0;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:24px;color:#444444;text-align:center;">
                                Hello ${safeUserName}, this is a confirmation that the password for your ${PRODUCT_NAME} account has been successfully updated.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fafafa;border:1px solid #eeeeee;border-left:4px solid #E02424;">
                                <tr>
                                    <td style="padding:20px;">
                                        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#666666;">
                                            <strong>Changed on:</strong> ${safeChangedAt}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:30px 0 40px 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:22px;color:#444444;">
                                If you made this change, you can safely ignore this email. No further action is required.
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#fff5f5;border:1px solid #feb2b2;">
                                <tr>
                                    <td style="padding:25px;">
                                        <h2 style="margin:0 0 10px 0;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:bold;color:#c53030;">
                                            Didn't make this change?
                                        </h2>
                                        <p style="margin:0 0 20px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:#742a2a;">
                                            If you did not change your password, your account may have been compromised. Please secure your account immediately by clicking the button below.
                                        </p>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                            <tr>
                                                <td align="left">
                                                    <table border="0" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td align="center" bgcolor="#E02424" style="border-radius:2px;">
                                                                <a href="${safeSecurityUrl}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Secure My Account</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#131313" style="padding:40px 60px;text-align:center;">
                            <p style="margin:0 0 10px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#ffffff;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">
                                ${PRODUCT_NAME}
                            </p>
                            <p style="margin:0 0 20px 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#a0a0a0;">
                                Need help? Contact our security team at <a href="mailto:${safeSupportEmail}" style="color:#E02424;text-decoration:none;">${safeSupportEmail}</a>
                            </p>
                            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#666666;">
                                &copy; 2026 ${PRODUCT_NAME}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
  };
}

function buildVerifyEmail({ userName, verifyUrl, otpCode, supportEmail, expirationMinutes = 15 }) {
  const safeUserName = escapeHtml(userName);
  const safeVerifyUrl = escapeHtml(verifyUrl);
  const safeOtpCode = escapeHtml(otpCode);
  const safeSupportEmail = escapeHtml(supportEmail);
  const safeExpiration = escapeHtml(expirationMinutes);

  return {
    subject: `Verify your ${PRODUCT_NAME} email`,
    text: `Hello ${userName}, verify your ${PRODUCT_NAME} account here: ${verifyUrl} or use code ${otpCode}.`,
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout:fixed;">
        <tr>
            <td align="center" style="padding:40px 10px 40px 10px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                    <tr>
                        <td align="center" style="padding:40px 40px 20px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#E02424" style="width:48px;height:48px;position:relative;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="48" height="48">
                                            <tr>
                                                <td align="center" valign="middle" style="color:#ffffff;font-size:24px;font-weight:900;line-height:48px;">L</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top:12px;font-size:14px;font-weight:900;color:#111111;letter-spacing:2px;text-transform:uppercase;">
                                        ${PRODUCT_NAME}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:20px 40px 20px 40px;">
                            <h1 style="margin:0;font-size:28px;font-weight:700;color:#111111;line-height:1.2;">Verify your email</h1>
                            <p style="margin:20px 0 0 0;font-size:16px;line-height:1.6;color:#4a4a4a;">
                                Hello ${safeUserName},<br /><br />
                                Thanks for joining ${PRODUCT_NAME}. To finalize your account setup and start exploring, please verify your email address.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:20px 40px 20px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" bgcolor="#E02424" style="border-radius:4px;">
                                        <a href="${safeVerifyUrl}" target="_blank" style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;text-transform:uppercase;letter-spacing:1px;">Verify Account</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:10px 40px 10px 40px;">
                            <p style="margin:0;font-size:14px;color:#9b9b9b;text-transform:uppercase;letter-spacing:1px;">or use this code</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding:10px 40px 30px 40px;">
                            <table border="0" cellpadding="0" cellspacing="0" bgcolor="#f9f9f9" style="border:1px solid #eeeeee;border-radius:4px;">
                                <tr>
                                    <td align="center" style="padding:20px 40px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;color:#111111;letter-spacing:12px;">
                                        ${safeOtpCode}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" style="padding:20px 40px 40px 40px;border-top:1px solid #f0f0f0;">
                            <p style="margin:0;font-size:14px;line-height:1.5;color:#7a7a7a;">
                                <strong>Validity:</strong> This link and code will expire in ${safeExpiration} minutes.
                            </p>
                            <p style="margin:12px 0 0 0;font-size:14px;line-height:1.5;color:#7a7a7a;">
                                If you did not create an account with ${PRODUCT_NAME}, you can safely ignore this email. Your security is our priority.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" bgcolor="#111111" style="padding:40px 40px 40px 40px;">
                            <p style="margin:0;font-size:12px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:2px;">${PRODUCT_NAME}</p>
                            <p style="margin:12px 0 0 0;font-size:12px;line-height:1.5;color:#888888;">
                                Need help? Contact our support team at <a href="mailto:${safeSupportEmail}" style="color:#E02424;text-decoration:none;">${safeSupportEmail}</a>
                            </p>
                            <p style="margin:20px 0 0 0;font-size:11px;line-height:1.5;color:#555555;">
                                &copy; 2026 ${PRODUCT_NAME}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
  };
}

module.exports = {
  PRODUCT_NAME,
  buildWelcomeEmail,
  buildResetPasswordEmail,
  buildPasswordChangedEmail,
  buildVerifyEmail
};
