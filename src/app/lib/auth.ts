import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {dbSingleton} from "./dbSingleton";
import {compare} from "bcrypt";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await dbSingleton.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    return null;
                }

                const passwordMatch = await compare(credentials.password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.userId,
                    userId: user.userId,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.userId;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.userId = token.userId as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
};