const admin = require("../config/firebase");
const DeviceToken = require("../modules/devices/device-token.model");

/**
 * Send a push notification to all registered devices of a user.
 * @param {string} userId
 * @param {{ title: string, body: string, data?: Record<string,string> }} payload
 */
async function sendToUser(userId, { title, body, data = {} }) {
  const records = await DeviceToken.find({ userId }).lean();
  if (!records.length) return;

  const tokens = records.map((r) => r.token);

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data
  });

  // Remove tokens that are no longer valid
  const stale = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
      stale.push(tokens[i]);
    }
  });

  if (stale.length) {
    await DeviceToken.deleteMany({ userId, token: { $in: stale } });
  }
}

module.exports = { sendToUser };
