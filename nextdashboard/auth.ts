import { authConfig } from "@/auth.config";
import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      name: string;
      image: string;
    } & DefaultSession["user"],
    access_token: string;
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
})