import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consumerUsers, candidateUsers } from "@/lib/db/schema";
import { normalizeEmail } from "@/lib/auth/tokens";
import { verifyPassword } from "@/lib/auth/password";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/login",
    newUser: "/account",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = (
          await db
            .select()
            .from(consumerUsers)
            .where(eq(consumerUsers.email, email))
            .limit(1)
        )[0];
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        await db
          .update(consumerUsers)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(consumerUsers.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          userType: "consumer",
        };
      },
    }),
    CredentialsProvider({
      id: "candidate-credentials",
      name: "Candidate email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email ?? "");
        const password = credentials?.password ?? "";
        if (!email || !password) return null;

        const user = (
          await db
            .select()
            .from(candidateUsers)
            .where(eq(candidateUsers.email, email))
            .limit(1)
        )[0];
        if (!user || !user.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        await db
          .update(candidateUsers)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(candidateUsers.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          userType: "candidate",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as { userType?: string };
        if (u.userType) token.userType = u.userType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = String(token.id);
      }
      if (session.user && token.userType) {
        (session.user as { userType?: string }).userType = String(token.userType);
      }
      return session;
    },
  },
};
