"use client";

import { create } from "zustand";

const useAuthStore = create((set) => ({
  accessToken: null,
  currentUser: null,
  setSession: ({ accessToken, user }) => {
    if (typeof window !== "undefined" && accessToken) {
      window.localStorage.setItem("linked_access_token", accessToken);
    }

    set({
      accessToken: accessToken || null,
      currentUser: user || null
    });
  },
  clearSession: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("linked_access_token");
      window.sessionStorage.removeItem("linked_session_check_attempts");
    }

    set({
      accessToken: null,
      currentUser: null
    });
  }
}));

export default useAuthStore;
