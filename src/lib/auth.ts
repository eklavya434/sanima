import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          bio: user.bio || "",
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.image = user.image;
        token.bio = (user as any).bio;
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.image = session.image;
        token.bio = session.bio;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        session.user.image = token.image as string;
        (session.user as any).bio = token.bio as string;
      }
      return session;
    },
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        if (!profile?.email) {
          return false;
        }
        const email = profile.email.toLowerCase();
        let existingUser = await prisma.user.findUnique({
          where: { email }
        });

        if (!existingUser) {
          const dummyPassword = Math.random().toString(36).slice(-10);
          const passwordHash = await bcrypt.hash(dummyPassword, 10);
          existingUser = await prisma.user.create({
            data: {
              name: profile.name || email.split("@")[0],
              email,
              passwordHash,
              avatarUrl: profile.image || null,
              bio: "",
            }
          });
        }
        user.id = existingUser.id;
        (user as any).bio = existingUser.bio || "";
        user.image = existingUser.avatarUrl;
        return true;
      }
      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
