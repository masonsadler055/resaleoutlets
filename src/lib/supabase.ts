import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the live Supabase project is wired up via env vars. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** Stripe publishable key present? Checkout stays honestly gated until it is. */
export const stripePublishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) || ''
export const isStripeConfigured = Boolean(stripePublishableKey)

// Fallback note: when env vars are absent the app runs on an in-memory/local
// data layer (see store.tsx) so the site still works end-to-end in a plain
// static preview. No data is seeded — the marketplace launches empty and all
// stats compute from real rows only.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
