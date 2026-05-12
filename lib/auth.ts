import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "amplifica2024";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email?.endsWith("@amplifica.io")) return null;

        // Check if user exists in DB
        const existing = await prisma.user.findUnique({ where: { email } });

        if (existing) {
          // User is disabled
          if (!existing.activo) return null;

          // User has a custom password hash — verify with bcrypt
          if (existing.passwordHash) {
            const valid = await bcrypt.compare(password, existing.passwordHash);
            if (!valid) return null;
          } else {
            // Fall back to default password
            if (password !== DEFAULT_PASSWORD) return null;
          }

          return { id: existing.id, email: existing.email, name: existing.name, role: existing.role };
        }

        // First login — create user if default password matches
        if (password !== DEFAULT_PASSWORD) return null;

        const user = await prisma.user.create({
          data: {
            email,
            name: email.split("@")[0],
            role: "SALES",
          },
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as { role?: string }).role ?? "SALES";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
