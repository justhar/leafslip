import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "@neondatabase/serverless";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  return {
    adapter: PostgresAdapter(pool),
    session: {
      strategy: "jwt",
    },
    providers: [
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
      authorized({ auth, request }) {
        const isAuth = !!auth;
        const isAuthPage =
          request.nextUrl.pathname.startsWith("/signin") ||
          request.nextUrl.pathname.startsWith("/error");
        const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

        // Redirect authenticated users away from auth pages
        if (isAuthPage && isAuth) {
          return Response.redirect(new URL("/dashboard", request.url));
        }

        // Redirect unauthenticated users to sign-in page
        if (isDashboard && !isAuth) {
          return Response.redirect(new URL("/signin", request.url));
        }

        return true;
      },
    },
    pages: {
      signIn: "/signin",
      error: "/error",
    },
  };
});
