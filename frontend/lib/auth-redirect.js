export function getPostAuthRedirectPath(user) {
  if (user?.role === "admin") {
    return "/admin";
  }

  if (user?.role === "moderator") {
    return "/moderator";
  }

  return "/home";
}

export function getLoginRedirectPath(pathname = "/home") {
  const next = pathname || "/home";
  return `/auth/login?next=${encodeURIComponent(next)}`;
}
