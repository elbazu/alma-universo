/**
 * Admin check — beta: single creator (Alma).
 *
 * We hard-code Alma's email via NEXT_PUBLIC_ADMIN_EMAIL (env var) with a
 * fallback literal. When a multi-admin model is needed (not in this beta),
 * replace this with a `role` field on the PocketBase users collection.
 */

const ADMIN_EMAIL =
  (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'zuniga.elba@gmail.com').toLowerCase()

export function isAdmin(user: unknown): boolean {
  const email = (user as { email?: unknown } | null | undefined)?.email
  if (typeof email !== 'string' || !email) return false
  return email.toLowerCase() === ADMIN_EMAIL
}
