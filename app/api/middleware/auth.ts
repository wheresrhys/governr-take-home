import { NextRequest, NextResponse } from "next/server";

export class AuthError extends Error {}

// Stubbed OAuth check. Real implementation would validate the token against
// an auth provider; for now any truthy header value is treated as valid.
export async function oauth(
  authHeader: string | null
): Promise<{ user_id: number; org_id: number }> {
  if (!authHeader) {
    throw new AuthError("Missing auth header");
  }

  return { user_id: 1, org_id: 1 };
}

// Route handlers have no `next()` chain like Express, so this is called
// inline at the top of a handler rather than mounted with `app.use`:
//
//   const auth = await requireAuth(request);
//   if (auth instanceof NextResponse) return auth;
export async function requireAuth(
  request: NextRequest | Request
): Promise<{ user_id: number; org_id: number } | NextResponse> {
  try {
    return await oauth(request.headers.get("authorization"));
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
