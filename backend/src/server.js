const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./db/mongoose");
const { connectRedis } = require("./db/redis");
const { logInfo, logError } = require("./config/logger");
const { verifyMailer } = require("./config/mailer");
const dns  =require("node:dns/promises");
dns.setServers(["8.8.8.8"]);


async function start() {
  try {
    await connectMongo();
    await connectRedis();
    await verifyMailer();

    const server = http.createServer(app);
    server.listen(env.port, () => {
      logInfo(`${env.appName} backend running on port ${env.port}`);
    });
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

start();
