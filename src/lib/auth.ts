import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // This is a demo simplified auth. In production use bcrypt to hash and compare passwords.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          // Auto-create user for demo purposes if they don't exist
          const newUser = await prisma.user.create({
             data: {
               email: credentials.email,
               name: credentials.email.split('@')[0],
               password: credentials.password // Note: plain text for demo, use bcrypt for prod
             }
          });
          return { id: newUser.id, email: newUser.email, name: newUser.name };
        }

        if (user.password !== credentials.password) {
           return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  }
};
