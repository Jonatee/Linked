const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./db/mongoose");
const { connectRedis, closeRedis } = require("./db/redis");
const { logInfo, logError } = require("./config/logger");
const { verifyMailer } = require("./config/mailer");
const { attachMessageSocketServer, startMessageStream, stopMessageStream } = require("./modules/messages/message-stream");

async function start() {
  try {
    await connectMongo();
    await connectRedis();
    await startMessageStream();
    await verifyMailer();

    const server = http.createServer(app);
    attachMessageSocketServer(server);

    server.listen(env.port, () => {
      logInfo(`${env.appName} backend running on port ${env.port}`);
    });

    const shutdown = async () => {
      await stopMessageStream().catch(() => {});
      await closeRedis().catch(() => {});
      server.close(() => process.exit(0));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

start();
