function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username).trim().toLowerCase();
}

function extractHashtags(text) {
  const matches = String(text || "").match(/#([\w-]+)/g) || [];
  return [...new Set(matches.map((item) => item.replace("#", "").toLowerCase()))];
}

function extractMentions(text) {
  const matches = String(text || "").match(/@([\w.]+)/g) || [];
  return [...new Set(matches.map((item) => item.replace("@", "").toLowerCase()))];
}

module.exports = {
  normalizeEmail,
  normalizeUsername,
  extractHashtags,
  extractMentions
};

