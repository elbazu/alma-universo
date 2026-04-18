/**
 * Feature flags are stored in the PocketBase `feature_flags` collection.
 * Every flag defaults to `false` so the beta ships with everything off.
 *
 * Flip via PocketBase admin → feature_flags collection.
 * Changes take effect on next page load (no deploy needed).
 */

export type FlagKey =
  | 'paywall_enabled'
  | 'stripe_enabled'
  | 'analytics_enabled'
  | 'chat_enabled'
  | 'affiliates_enabled'

export const DEFAULT_FLAGS: Record<FlagKey, boolean> = {
  paywall_enabled: false,
  stripe_enabled: false,
  analytics_enabled: false,
  chat_enabled: false,
  affiliates_enabled: false,
}

export const FLAG_KEYS: FlagKey[] = Object.keys(DEFAULT_FLAGS) as FlagKey[]
