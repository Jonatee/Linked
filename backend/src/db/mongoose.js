const mongoose = require("mongoose");
const env = require("../config/env");
const { logInfo } = require("../config/logger");

async function connectMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logInfo("MongoDB connected");
}

module.exports = {
  connectMongo,
  mongoose
};

