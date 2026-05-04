import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  // In browser, use current domain
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // On server, use env variable
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
    baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;