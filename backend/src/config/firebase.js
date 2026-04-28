const admin = require("firebase-admin");
const env = require("./env");

if (!admin.apps.length) {
  const raw = env.firebaseServiceAccount.replace(/\n/g, "\\n");
  const serviceAccount = JSON.parse(raw);
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

module.exports = admin;
