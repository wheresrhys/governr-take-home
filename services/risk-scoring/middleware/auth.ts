import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user_id: number;
        org_id: number;
      };
    }
  }
}

export class AuthError extends Error {}

// Stubbed OAuth check. Real implementation would validate the token against
// an auth provider; for now any truthy header value is treated as valid.
export async function oauth(
  authHeader: string | undefined
): Promise<{ user_id: number; org_id: number }> {
  if (!authHeader) {
    throw new AuthError("Missing auth header");
  }

  return { user_id: 1, org_id: 1 };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { user_id, org_id } = await oauth(req.headers.authorization);
    req.auth = { user_id, org_id };
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
