import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user_id: number;
      };
    }
  }
}

export class AuthError extends Error {}

// Stubbed API key check. Real implementation would validate the key against
// an auth provider; for now any truthy header value is treated as valid.
// org_id is no longer derived from auth here — callers scope queries using
// org_id from the request payload instead (see app.ts).
export async function apiKey(
  apiKeyHeader: string | undefined
): Promise<{ user_id: number }> {
  if (!apiKeyHeader) {
    throw new AuthError("Missing API key header");
  }

  return { user_id: 1 };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user_id } = await apiKey(req.headers["x-api-key"] as string | undefined);
    req.auth = { user_id };
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
