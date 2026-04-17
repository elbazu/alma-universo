import PocketBase from 'pocketbase'

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL!

// Client-side singleton
let clientPb: PocketBase | undefined

export function getPb(): PocketBase {
  // Server-side: always return a fresh instance
  if (typeof window === 'undefined') {
    return new PocketBase(POCKETBASE_URL)
  }

  // Client-side: reuse singleton
  if (!clientPb) {
    clientPb = new PocketBase(POCKETBASE_URL)

    // Load auth state from cookie
    clientPb.authStore.loadFromCookie(document.cookie)

    // Persist auth state changes back to cookie
    clientPb.authStore.onChange(() => {
      document.cookie = clientPb!.authStore.exportToCookie({ httpOnly: false })
    }, true)
  }

  return clientPb
}
// Fri Apr 17 11:44:22 EDT 2026
