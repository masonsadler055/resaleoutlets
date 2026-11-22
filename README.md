# Resale Outlets — resaleoutlets.com

Peer-to-peer streetwear, sneaker & luxury resale marketplace. Buyers and sellers,
optional $5 **Verified Authentic** upgrade (5-photo authentication review),
8% platform fee, payments held in escrow until 3 days after delivery, and
seller payouts via Stripe Connect.

## Stack

- **Vite + React + TypeScript + Tailwind CSS v4** (static SPA, no backend server)
- **Supabase** — Postgres database + Auth (email/password and Google OAuth)
- **Stripe** — payments + Connect payouts (gated on keys, see go-live steps)
- **Netlify** — hosting/deploy

## Local development

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

Without env vars the app still runs: it falls back to a local, browser-only
data layer that starts completely empty (no seeded listings or orders).

## Setup — Supabase (database & accounts)

1. Open your Supabase project → **SQL Editor** → paste the full contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `profiles`, `listings`, `orders`, `offers`, `threads`, `messages`,
   `verification_requests`, and `wishlist` tables with RLS enabled and
   permissive starter policies.
2. **Project Settings → API**: copy the **Project URL** and **anon/public key**.
3. **Authentication → Providers → Google** is already enabled for this project
   (client ID/secret saved there). Note: the Google OAuth consent app must be
   **Published** (Google Cloud Console → OAuth consent screen → Publish app)
   once the live site URLs exist, otherwise Google sign-in only works for
   listed test users. Also add the live Netlify URL under
   **Authentication → URL Configuration** (Site URL + redirect URLs).

## Deploy — Netlify

1. Netlify → **Add new site → Import from Git** → pick this repo.
   Build settings are already in `netlify.toml` (`npm run build`, publish `dist`,
   SPA redirect to `/index.html`).
2. **Site settings → Environment variables**, set:
   - `VITE_SUPABASE_URL` — your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key
   - `VITE_STRIPE_PUBLISHABLE_KEY` — your Stripe publishable key (when ready)
3. Trigger a redeploy after changing env vars (they are baked in at build time).

## Stripe go-live steps

1. Stripe Dashboard → **Developers → API keys**: copy the **publishable key**
   into Netlify as `VITE_STRIPE_PUBLISHABLE_KEY` and redeploy. Until this key
   exists, checkout on the site honestly shows "Payments are being connected"
   and nothing can be charged.
2. **Connect**: Stripe Dashboard → Settings → Connect → enable Express accounts
   so sellers can onboard and receive payouts (funds release 3 days after
   delivery, minus the 8% platform fee).
3. **Webhook**: Developers → Webhooks → add an endpoint pointing at your
   payments function/endpoint for the live domain, subscribe to
   `checkout.session.completed` and `payment_intent.succeeded`, and store the
   webhook signing secret server-side wherever the endpoint is hosted.
   (This static build records orders in Supabase at checkout time; the webhook
   is what reconciles real Stripe payments against those orders — wire it
   before taking live money.)

## Owner Console

A small **Owner** link sits under the footer. It is gated by the owner
passcode and provides listing moderation, the verification queue, account
management, and revenue stats computed only from real orders. Production
hardening: replace the client-side passcode check with a Supabase
`profiles.is_owner` role check enforced by RLS policies.
