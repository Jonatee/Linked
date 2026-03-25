const nodemailer = require("nodemailer");
const env = require("./env");
const { logInfo, logError } = require("./logger");

function maskEmail(email = "") {
  const [local, domain] = String(email).split("@");
  if (!local || !domain) {
    return email;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

const transporter = nodemailer.createTransport({
  host: env.mail.smtpHost,
  port: env.mail.smtpPort,
  secure: false,
  auth: env.mail.smtpUser && env.mail.smtpPass ? { user: env.mail.smtpUser, pass: env.mail.smtpPass } : undefined
});

async function sendMail({ to, subject, text, html }) {
  logInfo("SMTP send attempt", {
    host: env.mail.smtpHost,
    port: env.mail.smtpPort,
    from: env.mail.from,
    to: maskEmail(to)
  });

  try {
    const result = await transporter.sendMail({
      from: env.mail.from,
      to,
      subject,
      text,
      html
    });

    logInfo("SMTP send success", {
      to: maskEmail(to),
      messageId: result.messageId,
      accepted: result.accepted?.length || 0,
      rejected: result.rejected?.length || 0
    });

    return result;
  } catch (error) {
    logError("SMTP send failed", {
      to: maskEmail(to),
      code: error.code || null,
      response: error.response || null,
      message: error.message
    });
    throw error;
  }
}

async function verifyMailer() {
  try {
    await transporter.verify();
    logInfo("SMTP transporter verified", {
      host: env.mail.smtpHost,
      port: env.mail.smtpPort,
      user: env.mail.smtpUser
    });
  } catch (error) {
    logError("SMTP transporter verification failed", {
      code: error.code || null,
      response: error.response || null,
      message: error.message
    });
  }
}

module.exports = {
  sendMail,
  verifyMailer
};
