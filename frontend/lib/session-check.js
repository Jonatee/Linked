const SESSION_CHECK_KEY = "linked_session_check_attempts";
const MAX_SESSION_CHECKS = 1;

function readCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  return Number(window.sessionStorage.getItem(SESSION_CHECK_KEY) || 0);
}

export function canAttemptSessionCheck() {
  return readCount() < MAX_SESSION_CHECKS;
}

export function recordSessionCheckAttempt() {
  if (typeof window === "undefined") {
    return;
  }

  const nextCount = readCount() + 1;
  window.sessionStorage.setItem(SESSION_CHECK_KEY, String(nextCount));
}

export function resetSessionCheckAttempts() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(SESSION_CHECK_KEY);
}
