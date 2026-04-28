const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const env = require("./config/env");
const { requestLogger } = require("./config/logger");
const errorHandler = require("./middlewares/error-handler");
const notFound = require("./middlewares/not-found");
const { sendSuccess } = require("./utils/response");
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/users.routes");
const followRoutes = require("./modules/follows/follows.routes");
const mediaRoutes = require("./modules/media/media.routes");
const postRoutes = require("./modules/posts/posts.routes");
const commentRoutes = require("./modules/comments/comments.routes");
const bookmarkRoutes = require("./modules/bookmarks/bookmarks.routes");
const notificationRoutes = require("./modules/notifications/notifications.routes");
const searchRoutes = require("./modules/search/search.routes");
const moderationRoutes = require("./modules/moderation/moderation.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const deviceTokenRoutes = require("./modules/devices/device-tokens.routes");
const { globalApiRateLimiter } = require("./middlewares/rate-limit");

const app = express();

app.set("trust proxy", 1);
app.get("/health", (req, res) =>
  sendSuccess(res, {
    message: `${env.appName} API is healthy`,
    data: { uptime: process.uptime() }
  })
);
app.use(helmet());
app.use(
  cors({
    origin: env.appOrigin,
    credentials: true
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

app.use("/api/v1", globalApiRateLimiter);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/users", followRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1", commentRoutes);
app.use("/api/v1/bookmarks", bookmarkRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1", moderationRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/devices/tokens", deviceTokenRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
