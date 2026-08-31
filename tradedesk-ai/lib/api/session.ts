/**
 * Session + tenancy.
 *
 * The UI never hardcodes a business id: it asks for the session and uses
 * `session.business.id`. RLS scopes every backend query to the same business, so
 * the two agree by construction.
 */
import { db, delay } from "@/lib/api/mock/store";
import type { SessionContext } from "@/lib/api/types";

/**
 * The signed-in profile and the business it belongs to.
 *
 * TODO(backend): replace with `GET /api/session` — read the Supabase user from
 * the request cookie, join `profiles` → `businesses`, return 401 when signed out.
 */
export async function getSession(): Promise<SessionContext> {
  return delay({ profile: db.profile, business: db.business });
}
