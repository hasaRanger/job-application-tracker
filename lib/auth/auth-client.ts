import { createAuthClient } from "better-auth/react";

let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
};

const getAuthClient = () => {
  if (!authClientInstance) {
    authClientInstance = createAuthClient({
      baseURL: getBaseURL(),
    });
  }
  return authClientInstance;
};

export const authClient = new Proxy({}, {
  get: (_, prop) => {
    return getAuthClient()[prop as keyof ReturnType<typeof createAuthClient>];
  },
}) as ReturnType<typeof createAuthClient>;

const client = getAuthClient();
export const { signIn, signUp, signOut, useSession } = client;