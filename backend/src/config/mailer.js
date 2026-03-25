const axios = require("axios");
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

function parseSender(sender = "") {
  const trimmed = String(sender || "").trim();
  const matched = trimmed.match(/^(.*)<([^>]+)>$/);

  if (!matched) {
    return {
      name: "",
      email: trimmed
    };
  }

  return {
    name: matched[1].trim().replace(/^"|"$/g, ""),
    email: matched[2].trim()
  };
}

const transporter = nodemailer.createTransport({
  host: env.mail.smtpHost,
  port: env.mail.smtpPort,
  secure: false,
  auth: env.mail.smtpUser && env.mail.smtpPass ? { user: env.mail.smtpUser, pass: env.mail.smtpPass } : undefined
});

async function sendWithBrevoApi({ to, subject, text, html }) {
  const sender = parseSender(env.mail.from);

  logInfo("Brevo API send attempt", {
    provider: "brevo_api",
    from: env.mail.from,
    to: maskEmail(to)
  });

  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": env.mail.brevoApiKey
        },
        timeout: 20000
      }
    );

    logInfo("Brevo API send success", {
      to: maskEmail(to),
      messageId: response.data?.messageId || null
    });

    return response.data;
  } catch (error) {
    logError("Brevo API send failed", {
      to: maskEmail(to),
      status: error.response?.status || null,
      code: error.code || null,
      message: error.response?.data?.message || error.message
    });
    throw error;
  }
}

async function sendWithSmtp({ to, subject, text, html }) {
  logInfo("SMTP send attempt", {
    provider: "smtp",
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

async function sendMail({ to, subject, text, html }) {
  const provider = env.mail.provider === "brevo_api" ? "brevo_api" : "smtp";

  if (provider === "brevo_api") {
    if (!env.mail.brevoApiKey) {
      const error = new Error("BREVO_API_KEY is required when MAIL_PROVIDER=brevo_api");
      logError("Brevo API configuration missing", {
        provider,
        to: maskEmail(to),
        message: error.message
      });
      throw error;
    }

    return sendWithBrevoApi({ to, subject, text, html });
  }

  return sendWithSmtp({ to, subject, text, html });
}

async function verifyMailer() {
  const provider = env.mail.provider === "brevo_api" ? "brevo_api" : "smtp";

  if (provider === "brevo_api") {
    if (env.mail.brevoApiKey) {
      logInfo("Brevo API mailer configured", {
        provider,
        from: env.mail.from
      });
    } else {
      logError("Brevo API configuration missing", {
        provider,
        message: "BREVO_API_KEY is not set"
      });
    }

    return;
  }

  try {
    await transporter.verify();
    logInfo("SMTP transporter verified", {
      provider,
      host: env.mail.smtpHost,
      port: env.mail.smtpPort,
      user: env.mail.smtpUser
    });
  } catch (error) {
    logError("SMTP transporter verification failed", {
      provider,
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
