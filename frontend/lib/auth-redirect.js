export function getPostAuthRedirectPath(user) {
  if (user?.role === "admin") {
    return "/admin";
  }

  if (user?.role === "moderator") {
    return "/moderator";
  }

  return "/home";
}
