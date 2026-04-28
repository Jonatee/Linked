const dotenv = require("dotenv");

dotenv.config();

function readEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

const nodeEnv = readEnv("NODE_ENV", "development");
const defaultFrontendOrigin =
  nodeEnv === "production" ? "https://linked-theta.vercel.app" : "http://localhost:3000";

const env = {
  nodeEnv,
  appName: readEnv("APP_NAME", "LInked"),
  port: Number(readEnv("PORT", readEnv("BACKEND_PORT", 5000))),
  appOrigin: readEnv("APP_ORIGIN", "http://localhost:3000"),
  frontendOrigin: readEnv("FRONTEND_ORIGIN", defaultFrontendOrigin),
  mongoUri: readEnv("MONGODB_URI", "mongodb://localhost:27017/linked"),
  redisUrl: readEnv("REDIS_URL", "redis://localhost:6379"),
  jwtAccessSecret: readEnv("JWT_ACCESS_SECRET", "access-secret"),
  jwtRefreshSecret: readEnv("JWT_REFRESH_SECRET", "refresh-secret"),
  jwtAccessTtl: readEnv("JWT_ACCESS_TTL", "15m"),
  jwtRefreshTtl: readEnv("JWT_REFRESH_TTL", "30d"),
  refreshCookieName: readEnv("COOKIE_REFRESH_NAME", "linked_refresh_token"),
  cloudinary: {
    cloudName: readEnv("CLOUDINARY_CLOUD_NAME"),
    apiKey: readEnv("CLOUDINARY_API_KEY"),
    apiSecret: readEnv("CLOUDINARY_API_SECRET"),
    uploadFolder: readEnv("CLOUDINARY_UPLOAD_FOLDER", "linked")
  },
  firebaseServiceAccount: readEnv("FIREBASE_SERVICE_ACCOUNT", "{}"),
  mail: {
    provider: readEnv("MAIL_PROVIDER", "smtp"),
    from: readEnv("EMAIL_FROM", "no-reply@linked.local"),
    smtpHost: readEnv("SMTP_HOST", "localhost"),
    smtpPort: Number(readEnv("SMTP_PORT", 1025)),
    smtpUser: readEnv("SMTP_USER"),
    smtpPass: readEnv("SMTP_PASS"),
    brevoApiKey: readEnv("BREVO_API_KEY")
  }
};

module.exports = env;
