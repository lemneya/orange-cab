import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Demo user for development when OAuth is not configured
const DEMO_USER: User = {
  id: 1,
  openId: "demo-user-001",
  name: "Demo Admin",
  email: "admin@orangecab.com",
  loginMethod: "demo",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Check if OAuth is properly configured
  const oauthConfigured = process.env.OAUTH_SERVER_URL && 
    process.env.OAUTH_SERVER_URL !== 'https://oauth.example.com';

  if (!oauthConfigured) {
    // Use demo user in development when OAuth is not configured
    user = DEMO_USER;
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
