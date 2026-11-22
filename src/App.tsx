import React, { useMemo, useState } from 'react'
import { StoreProvider, useStore, BRANDS, CONDITIONS, PHOTO_CHECKLIST, type Listing, type AccountType } from './lib/store'
import { isStripeConfigured, isSupabaseConfigured } from './lib/supabase'

const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function VerifiedBadge() {
  return <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: '#10B981' }}>✓ Verified Authentic</span>
}

type View = { name: string; listingId?: string; threadId?: string }

function AppInner() {
  const s = useStore()
  const [view, setView] = useState<View>(() => (typeof window !== 'undefined' && window.location.pathname === '/privacy') ? { name: 'privacy' } : { name: 'home' })
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('All')
  const [condition, setCondition] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState('newest')
  const [ownerOpen, setOwnerOpen] = useState(false)

  const active = s.listings.filter(l => l.status === 'active')
  const results = useMemo(() => {
    let r = active.filter(l =>
      (brand === 'All' || l.brand === brand) &&
      (condition === 'All' || l.condition === condition) &&
      (!verifiedOnly || l.verified) &&
      (query.trim() === '' || (l.title + ' ' + l.brand + ' ' + l.category).toLowerCase().includes(query.toLowerCase()))
    )
    if (sort === 'price-low') r = [...r].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') r = [...r].sort((a, b) => b.price - a.price)
    if (sort === 'newest') r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    return r
  }, [active, brand, condition, verifiedOnly, query, sort])

  const [flash, setFlash] = useState(false)
  const [flashIdx, setFlashIdx] = useState(0)
  const FLASH_ICONS = ['👟', '👕', '👟', '🧥']

  const go = (v: View) => {
    if (v.name === view.name && v.listingId === view.listingId && v.threadId === view.threadId) { setView(v); window.scrollTo(0, 0); return }
    setFlashIdx(0); setFlash(true)
    window.setTimeout(() => setFlashIdx(1), 115)
    window.setTimeout(() => setFlashIdx(2), 230)
    window.setTimeout(() => setFlashIdx(3), 345)
    window.setTimeout(() => { setView(v); window.scrollTo(0, 0); setFlash(false) }, 470)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {flash && (
        <div className="fixed inset-0 z-[100] bg-stone-950 flex flex-col items-center justify-center gap-5">
          <span key={flashIdx} className="flash-icon text-7xl md:text-8xl" aria-hidden="true">{FLASH_ICONS[flashIdx]}</span>
          <div className="text-white/70 text-[11px] font-bold uppercase tracking-[0.3em]">Resale Outlets</div>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-[#fafaf9]/85 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 md:gap-5">
          <button onClick={() => go({ name: 'home' })} className="text-left shrink-0">
            <div className="text-lg font-black tracking-[-0.02em] leading-none">RESALE OUTLETS</div>
            <div className="text-[10px] font-semibold text-stone-400 tracking-[0.24em] mt-1">RESALEOUTLETS.COM</div>
          </button>
          <div className="flex-1 relative">
            <svg className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.8-3.8" /></svg>
            <input value={query} onChange={e => { setQuery(e.target.value); if (view.name !== 'home') go({ name: 'home' }) }}
              placeholder="Search sneakers, streetwear, luxury…" className="w-full bg-white border border-stone-200 rounded-full pl-10 pr-4 py-2 text-sm shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5" />
            {query && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-stone-200/80 rounded-2xl shadow-xl shadow-stone-900/5 py-1.5 max-h-72 overflow-auto">
                {active.filter(l => (l.title + ' ' + l.brand).toLowerCase().includes(query.toLowerCase())).slice(0, 6).map(l => (
                  <button key={l.id} onClick={() => go({ name: 'listing', listingId: l.id })} className="w-full text-left px-4 py-2 hover:bg-stone-50 transition text-sm flex justify-between gap-3">
                    <span className="truncate">{l.title}</span><span className="font-bold shrink-0">{money(l.price)}</span>
                  </button>
                ))}
                {active.filter(l => (l.title + ' ' + l.brand).toLowerCase().includes(query.toLowerCase())).length === 0 && <div className="px-4 py-3 text-sm text-stone-500">No matches yet.</div>}
              </div>
            )}
          </div>
          <nav className="flex items-center gap-0.5 text-sm font-semibold shrink-0">
            <button onClick={() => go({ name: 'sell' })} className="nav-link">Sell</button>
            {s.user ? <>
              <button onClick={() => go({ name: 'dashboard' })} className="nav-link">Dashboard</button>
              <button onClick={() => go({ name: 'messages' })} className="nav-link">Messages</button>
              <button onClick={() => go({ name: 'wishlist' })} className="nav-link">Wishlist</button>
              <span className="text-stone-400 hidden lg:inline px-2">{s.user.display_name}</span>
              <button onClick={() => s.signOut()} className="btn btn-outline px-3.5 py-1.5 text-sm ml-1">Sign out</button>
            </> : <button onClick={() => go({ name: 'auth' })} className="btn btn-dark px-4 py-2 text-sm ml-1">Sign in</button>}
          </nav>
        </div>
      </header>

      <main key={view.name + (view.listingId || '') + (view.threadId || '')} className="view-enter flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        {view.name === 'home' && <>
          <section className="relative overflow-hidden bg-stone-950 text-white rounded-[2rem] px-6 py-16 md:px-12 md:py-24 mb-12">
            <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-stone-800/50 blur-3xl glow-slow" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-40 -left-24 w-80 h-80 rounded-full bg-stone-800/30 blur-3xl glow-slower" aria-hidden="true" />
            <div className="relative">
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-stone-400">Resale Outlets — Peer-to-peer marketplace</div>
              <h1 className="text-5xl md:text-6xl font-black tracking-[-0.03em] leading-[1.02] max-w-2xl mt-5">Authenticated streetwear, sneakers & luxury — from real sellers.</h1>
              <p className="text-stone-400 text-base md:text-lg mt-5 max-w-xl leading-relaxed">Buy and sell sneakers, streetwear and designer pieces — peer to peer, from real sellers.</p>
              <div className="flex flex-wrap gap-3 mt-9">
                <a href="#brand-hubs" className="btn bg-white text-stone-950 px-6 py-3 text-sm hover:bg-stone-200">Browse brands</a>
                <button onClick={() => go({ name: 'sell' })} className="btn border border-white/25 text-white px-6 py-3 text-sm hover:border-white hover:bg-white/5">Sell an item</button>
              </div>
            </div>
          </section>

          <div className="overflow-hidden border-y border-stone-200/80 py-3 mb-12 -mt-4" aria-hidden="true">
            <div className="flex w-max animate-marquee">
              {[0, 1].map(copy => (
                <div key={copy} className="flex items-center gap-8 pr-8">
                  {BRANDS.map(b => (
                    <span key={b} className="flex items-center gap-8 whitespace-nowrap text-sm font-black uppercase tracking-[0.2em] text-stone-300">
                      {b} <span className="text-stone-200">✦</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div id="brand-hubs" className="eyebrow mb-2 scroll-mt-24">Browse</div>
          <h2 className="text-xl font-black tracking-tight mb-4">Brand hubs</h2>
          <div className="flex flex-wrap gap-2 mb-10">
            {['All', ...BRANDS].map(b => (
              <button key={b} onClick={() => setBrand(b)} className={`rounded-full px-4 py-2 text-sm font-semibold border shadow-sm transition ${brand === b ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 bg-white hover:border-stone-900'}`}>{b}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select value={condition} onChange={e => setCondition(e.target.value)} className="field field-pill w-auto">
              <option value="All">All conditions</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-600 cursor-pointer"><input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="accent-stone-900 w-4 h-4" /> Verified Authentic only</label>
            <select value={sort} onChange={e => setSort(e.target.value)} className="field field-pill w-auto ml-auto">
              <option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="border border-dashed border-stone-300 rounded-[2rem] bg-white/60 py-24 px-6 text-center">
              <div className="eyebrow mb-3">Just opened</div>
              <div className="font-black text-3xl tracking-tight mb-2.5">The marketplace is open — be the first to list.</div>
              <p className="text-stone-500 mb-6">No listings match yet. New pieces from sellers will appear here.</p>
              <button onClick={() => go({ name: 'sell' })} className="btn btn-dark px-6 py-2.5">List an item</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {results.map(l => <ListingCard key={l.id} l={l} onOpen={() => go({ name: 'listing', listingId: l.id })} />)}
            </div>
          )}

          <section className="border-t border-stone-200 mt-16 pt-8 pb-2">
            <div className="eyebrow mb-4">How Resale Outlets works</div>
            <div className="grid sm:grid-cols-3 gap-x-10 gap-y-5 text-sm leading-relaxed text-stone-500 max-w-4xl">
              <p><span className="font-semibold text-stone-700">Verified Authentic.</span> Every Verified Authentic piece passes a 5-photo authentication review.</p>
              <p><span className="font-semibold text-stone-700">Escrow protection.</span> Payments are held in escrow until 3 days after delivery.</p>
              <p><span className="font-semibold text-stone-700">Simple pricing.</span> 8% platform fee — sellers keep the rest.</p>
            </div>
          </section>
        </>}

        {view.name === 'listing' && <ListingDetail id={view.listingId!} go={go} />}
        {view.name === 'auth' && <AuthView go={go} />}
        {view.name === 'sell' && <SellView go={go} />}
        {view.name === 'dashboard' && <Dashboard go={go} />}
        {view.name === 'messages' && <MessagesView threadId={view.threadId} go={go} />}
        {view.name === 'wishlist' && <WishlistView go={go} />}
        {view.name === 'privacy' && <PrivacyView />}
        {view.name === 'owner' && <OwnerConsole />}
      </main>

      <footer className="border-t border-stone-200 bg-white mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-3 gap-10 text-sm">
          <div>
            <div className="text-base font-black tracking-[-0.02em]">RESALE OUTLETS</div>
            <div className="text-[10px] font-semibold text-stone-400 tracking-[0.24em] mt-1 mb-3">RESALEOUTLETS.COM</div>
            <p className="text-stone-500 leading-relaxed">Peer-to-peer streetwear, sneaker & luxury resale. 8% platform fee. Escrow held until 3 days after delivery.</p>
          </div>
          <div><div className="eyebrow mb-3">Marketplace</div><button className="block text-stone-500 hover:text-stone-950 transition py-0.5" onClick={() => go({ name: 'sell' })}>Sell an item</button><button className="block text-stone-500 hover:text-stone-950 transition py-0.5" onClick={() => go({ name: 'home' })}>Browse</button></div>
          <div><div className="eyebrow mb-3">Trust</div><p className="text-stone-500 leading-relaxed">Verified Authentic = 5-photo authentication review before the badge is granted.</p><button className="block text-stone-500 hover:text-stone-950 transition mt-2 underline underline-offset-4" onClick={() => go({ name: 'privacy' })}>Privacy Policy</button></div>
        </div>
        <div className="border-t border-stone-100 py-3 text-center">
          {/* Owner Console entry — intentionally unobtrusive, under the footer.
              NOTE (production hardening): this passcode gate is client-side only in
              this static deploy. Harden by moving owner checks to a Supabase
              profiles.is_owner role check + RLS policies before scaling. */}
          <button onClick={() => setOwnerOpen(true)} className="text-[11px] text-stone-300 hover:text-stone-500">Owner</button>
        </div>
      </footer>

      {ownerOpen && <OwnerGate onClose={() => setOwnerOpen(false)} onUnlock={() => { setOwnerOpen(false); go({ name: 'owner' }) }} />}
    </div>
  )
}

function ListingCard({ l, onOpen }: { l: Listing; onOpen: () => void }) {
  const s = useStore()
  const wished = s.wishlist.some(w => w.listing_id === l.id && w.user && w.user_id === s.user.id)
  return (
    <div className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-sm transition duration-300 hover:shadow-xl hover:shadow-stone-900/10 hover:-translate-y-1.5 hover:scale-[1.02] hover:border-stone-400 group">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="aspect-[4/5] bg-stone-100 flex items-center justify-center overflow-hidden">
          {l.image_url ? <img src={l.image_url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" /> : <span className="font-black uppercase tracking-[-0.01em] text-stone-300 text-xl px-4 text-center leading-tight">{l.brand}</span>}
        </div>
        <div className="p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">{l.brand}</div>
          <div className="font-medium leading-snug line-clamp-2 mt-1.5">{l.title}</div>
          <div className="text-[13px] text-stone-500 mt-1">{l.condition} · Size {l.size}</div>
          <div className="flex items-end justify-between gap-2 mt-2.5">
            <div className="text-lg font-black tracking-tight leading-none">{money(l.price)}</div>
            {l.verified && <VerifiedBadge />}
          </div>
        </div>
      </button>
      {s.user && <button onClick={() => s.toggleWishlist(l.id)} className="mx-4 mb-4 text-xs font-semibold border border-stone-200 rounded-full px-3.5 py-1.5 transition hover:border-stone-900">{wished ? '♥ Saved' : '♡ Save'}</button>}
    </div>
  )
}

function ListingDetail({ id, go }: { id: string; go: (v: any) => void }) {
  const s = useStore()
  const l = s.listings.find(x => x.id === id)
  const [offer, setOffer] = useState('')
  const [notice, setNotice] = useState('')
  if (!l) return <p className="text-stone-500">Listing not found or no longer available.</p>

  const handleBuy = async () => {
    if (!s.user) { go({ name: 'auth' }); return }
    if (!isStripeConfigured) { setNotice('Payments are being connected — checkout opens as soon as Stripe is live on this site. Your order intent has not been charged.'); return }
    const order = await s.buyNow(l)
    if (order) setNotice(`Order placed. ${money(order.amount)} is held in escrow and released to the seller 3 days after delivery.`)
  }
  const handleOffer = async () => {
    if (!s.user) { go({ name: 'auth' }); return }
    const amt = parseFloat(offer); if (!amt || amt <= 0) return
    await s.makeOffer(l, amt); setOffer(''); setNotice('Offer sent to the seller.')
  }
  const handleMessage = async () => {
    if (!s.user) { go({ name: 'auth' }); return }
    const tid = await s.startThread(l); if (tid) go({ name: 'messages', threadId: tid })
  }

  return (
    <div className="grid md:grid-cols-2 gap-10 md:gap-14">
      <div className="bg-stone-100 border border-stone-200/60 rounded-[2rem] aspect-square flex items-center justify-center overflow-hidden">
        {l.image_url ? <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" /> : <span className="font-black uppercase tracking-[-0.01em] text-stone-300 text-3xl px-6 text-center leading-tight">{l.brand}</span>}
      </div>
      <div className="md:py-2">
        <div className="eyebrow">{l.brand} · {l.category}</div>
        <h1 className="text-4xl font-black tracking-[-0.02em] leading-[1.05] mt-2.5">{l.title}</h1>
        {l.verified && <div className="mt-3"><VerifiedBadge /></div>}
        <div className="text-stone-500 mt-3">{l.condition} · Size {l.size} · Sold by {l.seller_name}</div>
        <div className="text-4xl font-black tracking-tight mt-6">{money(l.price)}</div>
        <p className="mt-5 text-stone-600 leading-relaxed whitespace-pre-wrap">{l.description}</p>
        {l.status !== 'active' && <div className="mt-5 font-bold text-red-700">This item has sold.</div>}
        {l.status === 'active' && s.user?.id !== l.seller_id && (
          <div className="mt-8 space-y-3">
            <button onClick={handleBuy} className="btn btn-dark w-full py-3.5 font-bold">Buy Now</button>
            <div className="flex gap-2">
              <input value={offer} onChange={e => setOffer(e.target.value)} type="number" min="1" placeholder="Your offer ($)" className="field field-pill flex-1" />
              <button onClick={handleOffer} className="btn btn-outline px-6 font-bold">Make Offer</button>
            </div>
            <button onClick={handleMessage} className="btn btn-outline w-full py-3">Message Seller</button>
          </div>
        )}
        {notice && <div className="mt-5 bg-stone-50 border border-stone-200 rounded-2xl shadow-sm px-4 py-3.5 text-sm leading-relaxed">{notice}</div>}
        <p className="text-xs text-stone-400 leading-relaxed border-t border-stone-200 mt-7 pt-4">Buyer protection: payment is held in escrow and released to the seller 3 days after delivery is confirmed.</p>
      </div>
    </div>
  )
}

function AuthView({ go }: { go: (v: any) => void }) {
  const s = useStore()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [name, setName] = useState(''); const [type, setType] = useState<AccountType>('both')
  const [err, setErr] = useState('')
  const [code, setCode] = useState(''); const [codeSent, setCodeSent] = useState(false)
  const [localCode, setLocalCode] = useState(''); const [codeErr, setCodeErr] = useState(''); const [codeMsg, setCodeMsg] = useState('')
  const sendCode = async () => {
    setCodeErr(''); setCodeMsg('')
    const r = await s.sendEmailCode(email)
    if (r.error) { setCodeErr(r.error); return }
    setCodeSent(true)
    if (r.localCode) { setLocalCode(r.localCode); setCodeMsg('Preview mode (no email backend connected on this device): your code is shown here. On the live site it arrives by email.') }
    else setCodeMsg('Code sent — check your email inbox for a 6-digit code.')
  }
  const verifyCode = async () => {
    setCodeErr('')
    const r = await s.verifyEmailCode(email, code)
    if (r) setCodeErr(r); else go({ name: 'home' })
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const r = mode === 'up' ? await s.signUp(email, password, name || email.split('@')[0], type) : await s.signIn(email, password)
    if (r) setErr(r); else go({ name: 'home' })
  }
  return (
    <div className="card max-w-md mx-auto rounded-[2rem] p-8 md:p-10">
      <h1 className="text-[28px] font-black tracking-tight leading-tight mb-1.5">{mode === 'up' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="text-sm text-stone-500 mb-7">Buy, sell, or both — one account.</p>
      <button onClick={() => s.signInWithGoogle()} className="btn btn-outline w-full py-3 mb-3">
        <span className="font-black mr-2">G</span> Continue with Google
      </button>
      {!isSupabaseConfigured && <p className="text-xs text-stone-400 mb-3">Google sign-in activates when the site is connected to its live accounts backend.</p>}
      <div className="flex items-center gap-3 my-5"><div className="flex-1 border-t border-stone-200" /><span className="text-[11px] font-bold tracking-[0.18em] text-stone-400">OR</span><div className="flex-1 border-t border-stone-200" /></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'up' && <>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Display name" className="field" />
          <select value={type} onChange={e => setType(e.target.value as AccountType)} className="field">
            <option value="buyer">Buyer</option><option value="seller">Seller</option><option value="both">Buyer & Seller</option>
          </select>
        </>}
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="field" />
        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="field" />
        {err && <div className="text-sm text-red-700">{err}</div>}
        <button className="btn btn-dark w-full py-3 font-bold">{mode === 'up' ? 'Sign up' : 'Sign in'}</button>
      </form>
      <div className="flex items-center gap-3 my-5"><div className="flex-1 border-t border-stone-200" /><span className="text-[11px] font-bold tracking-[0.14em] text-stone-400">OR USE AN EMAIL CODE — NO PASSWORD</span><div className="flex-1 border-t border-stone-200" /></div>
      <div className="space-y-3">
        <p className="text-sm text-stone-500 leading-relaxed">Enter your email above, we'll send a 6-digit sign-in code. New emails get an account automatically.</p>
        <button onClick={sendCode} className="btn btn-outline w-full py-3">Email me a sign-in code</button>
        {codeMsg && <div className="text-sm text-stone-600">{codeMsg}</div>}
        {localCode && <div className="text-center text-2xl font-black tracking-[0.35em] bg-stone-950 text-white rounded-2xl py-3">{localCode}</div>}
        {codeSent && <>
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" inputMode="numeric" className="field tracking-[0.3em]" />
          <button onClick={verifyCode} className="btn btn-dark w-full py-3 font-bold">Verify code & sign in</button>
        </>}
        {codeErr && <div className="text-sm text-red-700">{codeErr}</div>}
      </div>
      <button onClick={() => setMode(mode === 'up' ? 'in' : 'up')} className="text-sm font-semibold mt-5 underline underline-offset-4 hover:text-stone-500 transition">
        {mode === 'up' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  )
}

function PrivacyView() {
  return (
    <div className="card max-w-3xl mx-auto rounded-[2rem] p-8 md:p-12 space-y-6 text-sm leading-relaxed text-stone-600">
      <h1 className="text-4xl font-black tracking-tight text-stone-950">Privacy Policy</h1>
      <p className="text-stone-500">Resale Outlets (resaleoutlets.com) — last updated November 21, 2026. Operated by Mason Sadler, Lamar, Missouri, USA. Contact: masonsadler055@gmail.com.</p>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">What we collect</h2><p>When you create an account we collect your email address and display name. If you sign in with Google, Google shares your name, email address, and profile picture with us. When you buy or sell, we store your listings, offers, orders, messages, wishlist, and any photos you submit for Verified Authentic review. Payment card details are collected and processed by Stripe — we never see or store your full card number.</p></section>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">How we use it</h2><p>We use your information only to run the marketplace: signing you in, showing your listings and profile to other users, processing orders and payouts, holding payments in escrow until 3 days after delivery, reviewing Verified Authentic submissions, preventing fraud and abuse, and sending sign-in codes and transactional emails.</p></section>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">Who we share it with</h2><p>We do not sell your personal information. We share data only with the service providers that make the marketplace work: Supabase (account and marketplace database hosting), Stripe (payments and seller payouts), Brevo (transactional and sign-in emails), Google (only if you choose Sign in with Google), and Netlify (website hosting). Your display name, listings, and profile are visible to other marketplace users.</p></section>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">Cookies and sessions</h2><p>We use essential cookies/local storage only to keep you signed in and remember your session. We do not use advertising trackers.</p></section>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">Your choices</h2><p>You can edit your display name and account type in your profile at any time. To request a copy or deletion of your account data, email masonsadler055@gmail.com and we will handle it within 30 days. Order records may be retained where required for payment, tax, or fraud-prevention purposes.</p></section>
      <section><h2 className="font-black tracking-tight text-stone-950 text-base mb-1.5">Security and changes</h2><p>Accounts are protected by Supabase authentication and encrypted connections (HTTPS). We may update this policy as the marketplace grows; material changes will be posted on this page with a new date.</p></section>
    </div>
  )
}

function SellView({ go }: { go: (v: any) => void }) {
  const s = useStore()
  const [f, setF] = useState({ title: '', brand: 'Nike', category: 'Sneakers', price: '', size: '', condition: 'Excellent', description: '', image_url: '' })
  const [wantVerified, setWantVerified] = useState(false)
  const [photos, setPhotos] = useState<string[]>(PHOTO_CHECKLIST.map(() => ''))
  const [done, setDone] = useState(false)
  if (!s.user) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="eyebrow mb-3">Sell</div>
      <h1 className="text-3xl font-black tracking-tight mb-2.5">Sign in to sell</h1>
      <p className="text-stone-500 mb-6">You need an account so buyers can pay you and message you.</p>
      <button onClick={() => go({ name: 'auth' })} className="btn btn-dark px-6 py-2.5">Sign in</button>
    </div>
  )
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await s.addListing({ title: f.title, brand: f.brand, category: f.category, price: parseFloat(f.price) || 0, size: f.size, condition: f.condition, description: f.description, image_url: f.image_url },
      wantVerified ? photos : undefined)
    setDone(true)
  }
  if (done) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="eyebrow mb-3">Done</div>
      <h1 className="text-3xl font-black tracking-tight mb-2.5">Listing published</h1>
      <p className="text-stone-500 mb-6">{wantVerified ? 'Your Verified Authentic request ($5) is in the review queue — the badge appears once approved.' : 'Your item is live on the marketplace.'}</p>
      <button onClick={() => go({ name: 'home' })} className="btn btn-dark px-6 py-2.5">View marketplace</button>
    </div>
  )
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }))
  return (
    <form onSubmit={submit} className="card max-w-2xl mx-auto rounded-[2rem] p-8 md:p-10 space-y-4">
      <div>
        <div className="eyebrow mb-2">Sell</div>
        <h1 className="text-[28px] font-black tracking-tight leading-tight">Sell an item</h1>
      </div>
      <input required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title — e.g. Air Jordan 1 Retro High OG 'Chicago'" className="field" />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.brand} onChange={e => set('brand', e.target.value)} className="field">{BRANDS.map(b => <option key={b}>{b}</option>)}</select>
        <select value={f.category} onChange={e => set('category', e.target.value)} className="field">
          {['Sneakers', 'Streetwear', 'Watches', 'Bags', 'Accessories', 'Designer Luxury'].map(c => <option key={c}>{c}</option>)}
        </select>
        <input required type="number" min="1" value={f.price} onChange={e => set('price', e.target.value)} placeholder="Price ($)" className="field" />
        <input required value={f.size} onChange={e => set('size', e.target.value)} placeholder="Size" className="field" />
        <select value={f.condition} onChange={e => set('condition', e.target.value)} className="field">{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>
        <input value={f.image_url} onChange={e => set('image_url', e.target.value)} placeholder="Photo URL (optional)" className="field" />
      </div>
      <textarea required value={f.description} onChange={e => set('description', e.target.value)} placeholder="Description — condition details, flaws, box/accessories included…" rows={4} className="field resize-none" />
      <div className="bg-stone-50 border border-stone-200 rounded-3xl p-5">
        <label className="flex items-start gap-3 font-semibold cursor-pointer">
          <input type="checkbox" checked={wantVerified} onChange={e => setWantVerified(e.target.checked)} className="mt-1 accent-stone-900" />
          <span>Add <span style={{ color: '#10B981' }}>Verified Authentic</span> upgrade — $5<br /><span className="text-sm font-normal text-stone-500 leading-relaxed">Submit the 5 authentication photos below. A reviewer checks them before the badge goes live.</span></span>
        </label>
        {wantVerified && <div className="mt-4 space-y-2">
          {PHOTO_CHECKLIST.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm w-48 shrink-0">{i + 1}. {label}</span>
              <input value={photos[i]} onChange={e => { const p = [...photos]; p[i] = e.target.value; setPhotos(p) }} placeholder="Photo URL" className="field flex-1" />
            </div>
          ))}
        </div>}
      </div>
      <button className="btn btn-dark w-full py-3.5 font-bold">Publish listing</button>
    </form>
  )
}

function ProfileSection() {
  const s = useStore()
  const [name, setName] = useState(s.user?.display_name || '')
  const [type, setType] = useState(s.user?.account_type || 'both')
  const [saved, setSaved] = useState(false)
  if (!s.user) return null
  const purchases = s.orders.filter(o => o.buyer_id === s.user!.id).length
  const sales = s.orders.filter(o => o.seller_id === s.user!.id).length
  return (
    <section className="card p-6 md:p-7">
      <h2 className="font-black tracking-tight text-lg mb-1">Your profile</h2>
      <p className="text-sm text-stone-500 leading-relaxed mb-5">Every account has a profile — buyers too. This is the name other users see on your offers, messages and listings.</p>
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div><div className="eyebrow mb-1.5">Email</div><div className="font-semibold">{s.user.email}</div></div>
        <div><div className="eyebrow mb-1.5">Activity</div><div className="font-semibold">{purchases} purchase{purchases === 1 ? '' : 's'} · {sales} sale{sales === 1 ? '' : 's'}</div></div>
        <label className="block"><span className="eyebrow block mb-1.5">Display name</span>
          <input value={name} onChange={e => { setName(e.target.value); setSaved(false) }} className="field" /></label>
        <label className="block"><span className="eyebrow block mb-1.5">Account type</span>
          <select value={type} onChange={e => { setType(e.target.value as any); setSaved(false) }} className="field">
            <option value="buyer">Buyer</option><option value="seller">Seller</option><option value="both">Buyer & seller</option>
          </select></label>
      </div>
      <button onClick={async () => { await s.updateProfile(name.trim() || s.user!.display_name, type as any); setSaved(true) }} className="btn btn-dark mt-5 px-5 py-2 text-sm">Save profile</button>
      {saved && <span className="ml-3 text-sm font-semibold text-stone-600">Saved.</span>}
    </section>
  )
}

function Dashboard({ go }: { go: (v: any) => void }) {
  const s = useStore()
  if (!s.user) return <div className="text-center py-20"><button onClick={() => go({ name: 'auth' })} className="btn btn-dark px-6 py-2.5">Sign in to view your dashboard</button></div>
  const mine = s.listings.filter(l => l.seller_id === s.user!.id)
  const sales = s.orders.filter(o => o.seller_id === s.user!.id)
  const purchases = s.orders.filter(o => o.buyer_id === s.user!.id)
  const inbox = s.offers.filter(o => o.seller_id === s.user!.id && o.status === 'pending')
  const gross = sales.reduce((a, o) => a + o.amount, 0)
  const fees = sales.reduce((a, o) => a + o.platform_fee, 0)
  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow mb-2">Account</div>
        <h1 className="text-4xl font-black tracking-tight">Your dashboard</h1>
      </div>
      <ProfileSection />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Active listings', String(mine.filter(l => l.status === 'active').length)], ['Total sales', String(sales.length)], ['Gross sales', money(gross)], ['Your payout (after 8% fee)', money(gross - fees)]].map(([k, v]) => (
          <div key={k} className="card p-5"><div className="eyebrow">{k}</div><div className="text-[28px] font-black tracking-tight mt-2 leading-none">{v}</div></div>
        ))}
      </div>

      <section className="card p-6 md:p-7">
        <h2 className="font-black tracking-tight text-lg mb-2">Payouts — Stripe Connect</h2>
        {isStripeConfigured
          ? <p className="text-sm text-stone-600 leading-relaxed">Stripe is connected. Sale funds are held in escrow and released to your connected Stripe account 3 days after delivery.</p>
          : <p className="text-sm text-stone-600 leading-relaxed">Stripe Connect is not connected yet, so payouts can't be sent. Once the site's Stripe keys are set, you'll onboard with Stripe here and payouts will release 3 days after delivery (after the 8% platform fee).</p>}
      </section>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">Offers to review</h2>
        {inbox.length === 0 ? <p className="text-stone-500 text-sm">No pending offers.</p> : inbox.map(o => (
          <div key={o.id} className="card p-4 mb-2.5 flex items-center gap-3 transition hover:border-stone-300">
            <div className="flex-1"><span className="font-semibold">{o.listing_title}</span> — {money(o.amount)} from {o.buyer_name}</div>
            <button onClick={() => s.respondOffer(o, true)} className="btn btn-dark px-4 py-1.5 text-sm">Accept</button>
            <button onClick={() => s.respondOffer(o, false)} className="btn btn-outline px-4 py-1.5 text-sm">Decline</button>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">Your listings</h2>
        {mine.length === 0 ? <p className="text-stone-500 text-sm">You haven't listed anything yet.</p> : mine.map(l => (
          <div key={l.id} className="card p-4 mb-2.5 flex items-center gap-3 transition hover:border-stone-300">
            <div className="flex-1 font-semibold">{l.title} {l.verified && <VerifiedBadge />}<div className="text-sm text-stone-500 font-normal mt-0.5">{money(l.price)} · {l.status}</div></div>
            {l.status === 'active' && <button onClick={() => s.removeListing(l.id)} className="text-sm font-semibold text-red-700 hover:text-red-900 transition">Remove</button>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">Your purchases</h2>
        {purchases.length === 0 ? <p className="text-stone-500 text-sm">No purchases yet.</p> : purchases.map(o => (
          <div key={o.id} className="card p-4 mb-2.5 text-sm transition hover:border-stone-300"><span className="font-semibold">{o.listing_title}</span> — {money(o.amount)} · {o.status}</div>
        ))}
      </section>
    </div>
  )
}

function MessagesView({ threadId, go }: { threadId?: string; go: (v: any) => void }) {
  const s = useStore()
  const [activeId, setActiveId] = useState<string | undefined>(threadId)
  const [draft, setDraft] = useState('')
  if (!s.user) return <div className="text-center py-20"><button onClick={() => go({ name: 'auth' })} className="btn btn-dark px-6 py-2.5">Sign in to view messages</button></div>
  const mine = s.threads.filter(t => t.buyer_id === s.user!.id || t.seller_id === s.user!.id)
  const active = mine.find(t => t.id === activeId) || mine[0]
  const msgs = active ? s.messages.filter(m => m.thread_id === active.id) : []
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="space-y-2.5">
        <div className="eyebrow mb-1">Inbox</div>
        <h1 className="text-3xl font-black tracking-tight mb-3">Messages</h1>
        {mine.length === 0 && <p className="text-stone-500 text-sm leading-relaxed">No conversations yet. Message a seller from any listing.</p>}
        {mine.map(t => (
          <button key={t.id} onClick={() => setActiveId(t.id)} className={`card w-full text-left p-4 transition hover:border-stone-300 ${active?.id === t.id ? 'border-stone-900 shadow-md shadow-stone-900/5' : ''}`}>
            <div className="font-semibold text-sm">{t.listing_title}</div>
            <div className="text-xs text-stone-500 mt-0.5">with {t.buyer_id === s.user!.id ? t.seller_name : t.buyer_name}</div>
          </button>
        ))}
      </div>
      <div className="card md:col-span-2 rounded-[2rem] p-6 md:p-7 flex flex-col min-h-[420px]">
        {active ? <>
          <div className="font-black tracking-tight text-lg pb-4 border-b border-stone-100">{active.listing_title}</div>
          <div className="flex-1 space-y-2.5 overflow-auto py-4">
            {msgs.map(m => (
              <div key={m.id} className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${m.sender_id === s.user!.id ? 'bg-stone-950 text-white ml-auto rounded-3xl rounded-br-md' : 'bg-stone-100 rounded-3xl rounded-bl-md'}`}>
                <div className="text-[11px] opacity-60 mb-0.5">{m.sender_name}</div>{m.body}
              </div>
            ))}
            {msgs.length === 0 && <p className="text-stone-400 text-sm">Say hello to start the conversation.</p>}
          </div>
          <div className="flex gap-2 mt-2">
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { s.sendMessage(active.id, draft); setDraft('') } }} placeholder="Write a message…" className="field field-pill flex-1" />
            <button onClick={() => { s.sendMessage(active.id, draft); setDraft('') }} className="btn btn-dark px-6">Send</button>
          </div>
        </> : <p className="text-stone-400">Select a conversation.</p>}
      </div>
    </div>
  )
}

function WishlistView({ go }: { go: (v: any) => void }) {
  const s = useStore()
  if (!s.user) return <div className="text-center py-20"><button onClick={() => go({ name: 'auth' })} className="btn btn-dark px-6 py-2.5">Sign in to view your wishlist</button></div>
  const items = s.listings.filter(l => s.wishlist.some(w => w.listing_id === l.id && w.user_id === s.user!.id))
  return (
    <div>
      <div className="eyebrow mb-2">Saved</div>
      <h1 className="text-4xl font-black tracking-tight mb-7">Wishlist</h1>
      {items.length === 0 ? <p className="text-stone-500">Nothing saved yet.</p> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{items.map(l => <ListingCard key={l.id} l={l} onOpen={() => go({ name: 'listing', listingId: l.id })} />)}</div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Owner Console — hidden under the footer, passcode-gated.
// Hardening note: client-side gate only in this static deploy; production
// hardening = Supabase profiles.is_owner role check enforced by RLS.
// ---------------------------------------------------------------------------
const OWNER_PASSCODE = '102824'

function OwnerGate({ onClose, onUnlock }: { onClose: () => void; onUnlock: () => void }) {
  const [code, setCode] = useState(''); const [err, setErr] = useState('')
  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h2 className="font-black tracking-tight text-xl mb-2">Owner access</h2>
        <p className="text-sm text-stone-500 mb-5">Enter the owner passcode.</p>
        <input type="password" value={code} onChange={e => setCode(e.target.value)} className="field mb-3" placeholder="Passcode" />
        {err && <div className="text-sm text-red-700 mb-3">{err}</div>}
        <button onClick={() => { if (code === OWNER_PASSCODE) onUnlock(); else setErr('Incorrect passcode.') }} className="btn btn-dark w-full py-3 font-bold">Unlock</button>
      </div>
    </div>
  )
}

function OwnerConsole() {
  const s = useStore()
  // Revenue stats are computed ONLY from real orders rows. With zero orders
  // every figure is $0 — nothing is seeded or simulated.
  const gmv = s.orders.reduce((a, o) => a + o.amount, 0)
  const commission = s.orders.reduce((a, o) => a + o.platform_fee, 0)
  const pending = s.verification.filter(v => v.status === 'pending')
  return (
    <div className="space-y-10">
      <div>
        <div className="eyebrow mb-2">Owner</div>
        <h1 className="text-4xl font-black tracking-tight">Owner Console</h1>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['GMV (real orders)', money(gmv)], ['Platform revenue (8%)', money(commission)], ['Orders', String(s.orders.length)], ['Accounts', String(s.profiles.length)]].map(([k, v]) => (
          <div key={k} className="card p-5"><div className="eyebrow">{k}</div><div className="text-[28px] font-black tracking-tight mt-2 leading-none">{v}</div></div>
        ))}
      </div>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">Verification queue</h2>
        {pending.length === 0 ? <p className="text-stone-500 text-sm">No pending verification requests.</p> : pending.map(v => (
          <div key={v.id} className="card p-5 mb-2.5 transition hover:border-stone-300">
            <div className="font-semibold">{v.listing_title}</div>
            <div className="text-sm text-stone-500 mt-0.5">Seller: {v.seller_name} · {v.photos.filter(Boolean).length}/5 photos submitted</div>
            <div className="flex gap-2 mt-3.5">
              <button onClick={() => s.reviewVerification(v.id, true, v.listing_title)} className="btn btn-dark px-4 py-1.5 text-sm">Approve badge</button>
              <button onClick={() => s.reviewVerification(v.id, false, v.listing_title)} className="btn btn-outline px-4 py-1.5 text-sm">Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">All listings</h2>
        {s.listings.length === 0 ? <p className="text-stone-500 text-sm">No listings yet.</p> : s.listings.map(l => (
          <div key={l.id} className="card p-4 mb-2.5 flex items-center gap-3 transition hover:border-stone-300">
            <div className="flex-1 font-semibold">{l.title} {l.verified && <VerifiedBadge />}<div className="text-sm text-stone-500 font-normal mt-0.5">{money(l.price)} · {l.status} · by {l.seller_name}</div></div>
            {l.status === 'active' && <button onClick={() => s.removeListing(l.id)} className="text-sm font-semibold text-red-700 hover:text-red-900 transition">Remove</button>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black tracking-tight text-lg mb-3.5">Accounts</h2>
        {s.profiles.length === 0 ? <p className="text-stone-500 text-sm">No accounts yet.</p> : s.profiles.map(p => (
          <div key={p.id} className="card p-4 mb-2.5 flex items-center gap-3 transition hover:border-stone-300">
            <div className="flex-1"><span className="font-semibold">{p.display_name}</span> <span className="text-sm text-stone-500">{p.email} · {p.account_type}{p.banned ? ' · BANNED' : ''}</span></div>
            {!p.is_owner && <button onClick={() => s.setBanned(p.id, !p.banned)} className="text-sm font-semibold hover:text-stone-500 transition">{p.banned ? 'Unban' : 'Ban'}</button>}
          </div>
        ))}
      </section>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}
