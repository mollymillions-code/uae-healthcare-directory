import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      userType?: "consumer" | "candidate" | "clinic";
    };
  }

  interface User {
    userType?: "consumer" | "candidate" | "clinic";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    userType?: string;
  }
}
