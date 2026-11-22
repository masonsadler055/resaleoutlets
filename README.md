# Resale Outlets — resaleoutlets.com

Peer-to-peer streetwear, sneaker & luxury resale marketplace.
Grailed-style editorial marketplace with StockX-style trust signals: Verified Authentic listings, brand hubs, offers & messaging, seller dashboards, Stripe Connect payouts (8% platform fee, escrow released 3 days after delivery), and an owner admin console.

## Launch checklist
- [x] GitHub account + this repo
- [ ] Cloudflare account (Pages hosting) — verification pending, revisit
- [ ] Supabase project (database + auth: email, Google; Apple later)
- [ ] Stripe Connect enabled + API keys added as environment variables (test mode first)
- [ ] Deploy to Cloudflare Pages (free *.pages.dev address)
- [ ] Buy resaleoutlets.com and attach as custom domain

## Environment variables (names only — never commit real values)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

## Stack
React, TypeScript, Tailwind CSS, Lucide icons, Supabase, Stripe.
