import { environment } from "@/env/environment";
import type { NextAuthConfig } from "next-auth";
import Discord from "next-auth/providers/discord";

const SCOPES = ['identify', 'guilds']

export const authConfig = {
  /*pages: {
    signIn: "/auth/login",
  },*/
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return !!auth;
      /*
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;*/
    },
    async jwt({token, account}) {
      if (account) token = Object.assign({}, token, { access_token: account.access_token });
      return token;
    },
    async session({session, token}) {
      if(session && token.access_token) session = Object.assign({}, session, {access_token: token.access_token});
      return session;
    }

  },
  providers: [
    Discord({
      clientId: environment.api.oauth.clientId,
      clientSecret: environment.api.oauth.secretId,
      authorization: 'https://discord.com/api/oauth2/authorize?scope=identify+guilds' // shitty design!
      //authorization: { params: { scope: SCOPES.join(' ') } }, // not supported yet.
    })
  ], 
  secret: environment.api.sessionSecret,
  debug: true,
  trustHost: true,
} satisfies NextAuthConfig;