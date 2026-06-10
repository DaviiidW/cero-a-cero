import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nickGlobal: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    nickGlobal: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nickGlobal: string;
    role: string;
  }
}
