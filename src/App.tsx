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
  const [view, setView] = useState<View>({ name: 'home' })
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

  const go = (v: View) => { setView(v); window.scrollTo(0, 0) }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => go({ name: 'home' })} className="text-left">
            <div className="text-xl font-black tracking-tight leading-none">RESALE OUTLETS</div>
            <div className="text-[11px] text-stone-500 tracking-widest">RESALEOUTLETS.COM</div>
          </button>
          <div className="flex-1 relative">
            <input value={query} onChange={e => { setQuery(e.target.value); if (view.name !== 'home') go({ name: 'home' }) }}
              placeholder="Search sneakers, streetwear, luxury…" className="w-full border border-stone-300 rounded-full px-4 py-2 text-sm outline-none focus:border-stone-900" />
            {query && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-72 overflow-auto">
                {active.filter(l => (l.title + ' ' + l.brand).toLowerCase().includes(query.toLowerCase())).slice(0, 6).map(l => (
                  <button key={l.id} onClick={() => go({ name: 'listing', listingId: l.id })} className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex justify-between">
                    <span>{l.title}</span><span className="font-semibold">{money(l.price)}</span>
                  </button>
                ))}
                {active.filter(l => (l.title + ' ' + l.brand).toLowerCase().includes(query.toLowerCase())).length === 0 && <div className="px-4 py-3 text-sm text-stone-500">No matches yet.</div>}
              </div>
            )}
          </div>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <button onClick={() => go({ name: 'sell' })} className="hover:underline">Sell</button>
            {s.user ? <>
              <button onClick={() => go({ name: 'dashboard' })} className="hover:underline">Dashboard</button>
              <button onClick={() => go({ name: 'messages' })} className="hover:underline">Messages</button>
              <button onClick={() => go({ name: 'wishlist' })} className="hover:underline">Wishlist</button>
              <span className="text-stone-500 hidden md:inline">{s.user.display_name}</span>
              <button onClick={() => s.signOut()} className="border border-stone-900 rounded-full px-3 py-1">Sign out</button>
            </> : <button onClick={() => go({ name: 'auth' })} className="bg-stone-900 text-white rounded-full px-4 py-1.5">Sign in</button>}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        {view.name === 'home' && <>
          <section className="bg-stone-900 text-white rounded-3xl px-8 py-12 mb-8">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight max-w-2xl">Authenticated streetwear, sneakers & luxury — from real sellers.</h1>
            <p className="text-stone-300 mt-3 max-w-xl">Every Verified Authentic piece passes a 5-photo authentication review. Payments are held in escrow until 3 days after delivery.</p>
          </section>

          <h2 className="font-black text-lg mb-3">Brand hubs</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {['All', ...BRANDS].map(b => (
              <button key={b} onClick={() => setBrand(b)} className={`rounded-full px-4 py-1.5 text-sm font-semibold border ${brand === b ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 bg-white'}`}>{b}</button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <select value={condition} onChange={e => setCondition(e.target.value)} className="border border-stone-300 rounded-full px-3 py-1.5 text-sm bg-white">
              <option value="All">All conditions</option>{CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} /> Verified Authentic only</label>
            <select value={sort} onChange={e => setSort(e.target.value)} className="border border-stone-300 rounded-full px-3 py-1.5 text-sm bg-white ml-auto">
              <option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
            </select>
          </div>

          {results.length === 0 ? (
            <div className="border border-dashed border-stone-300 rounded-3xl py-20 text-center">
              <div className="font-black text-2xl mb-2">The marketplace is open — be the first to list.</div>
              <p className="text-stone-500 mb-5">No listings match yet. New pieces from sellers will appear here.</p>
              <button onClick={() => go({ name: 'sell' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">List an item</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {results.map(l => <ListingCard key={l.id} l={l} onOpen={() => go({ name: 'listing', listingId: l.id })} />)}
            </div>
          )}
        </>}

        {view.name === 'listing' && <ListingDetail id={view.listingId!} go={go} />}
        {view.name === 'auth' && <AuthView go={go} />}
        {view.name === 'sell' && <SellView go={go} />}
        {view.name === 'dashboard' && <Dashboard go={go} />}
        {view.name === 'messages' && <MessagesView threadId={view.threadId} go={go} />}
        {view.name === 'wishlist' && <WishlistView go={go} />}
        {view.name === 'owner' && <OwnerConsole />}
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6 text-sm">
          <div><div className="font-black">RESALE OUTLETS</div><p className="text-stone-500 mt-1">Peer-to-peer streetwear, sneaker & luxury resale. 8% platform fee. Escrow held until 3 days after delivery.</p></div>
          <div><div className="font-bold mb-2">Marketplace</div><button className="block text-stone-500" onClick={() => go({ name: 'sell' })}>Sell an item</button><button className="block text-stone-500" onClick={() => go({ name: 'home' })}>Browse</button></div>
          <div><div className="font-bold mb-2">Trust</div><p className="text-stone-500">Verified Authentic = 5-photo authentication review before the badge is granted.</p></div>
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
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden group">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
          {l.image_url ? <img src={l.image_url} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <span className="text-stone-400 text-sm px-4 text-center">{l.brand}</span>}
        </div>
        <div className="p-3">
          <div className="text-xs uppercase tracking-widest text-stone-500">{l.brand}</div>
          <div className="font-semibold leading-snug line-clamp-2">{l.title}</div>
          <div className="text-sm text-stone-500">{l.condition} · Size {l.size}</div>
          {l.verified && <VerifiedBadge />}
          <div className="font-black mt-1">{money(l.price)}</div>
        </div>
      </button>
      {s.user && <button onClick={() => s.toggleWishlist(l.id)} className="mx-3 mb-3 text-xs font-semibold border border-stone-300 rounded-full px-3 py-1">{wished ? '♥ Saved' : '♡ Save'}</button>}
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
    <div className="grid md:grid-cols-2 gap-8">
      <div className="bg-stone-100 rounded-3xl aspect-square flex items-center justify-center overflow-hidden">
        {l.image_url ? <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" /> : <span className="text-stone-400">{l.brand}</span>}
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest text-stone-500">{l.brand} · {l.category}</div>
        <h1 className="text-3xl font-black mt-1">{l.title}</h1>
        {l.verified && <div className="mt-2"><VerifiedBadge /></div>}
        <div className="text-stone-500 mt-2">{l.condition} · Size {l.size} · Sold by {l.seller_name}</div>
        <div className="text-4xl font-black mt-4">{money(l.price)}</div>
        <p className="mt-4 text-stone-700 whitespace-pre-wrap">{l.description}</p>
        {l.status !== 'active' && <div className="mt-4 font-bold text-red-700">This item has sold.</div>}
        {l.status === 'active' && s.user?.id !== l.seller_id && (
          <div className="mt-6 space-y-3">
            <button onClick={handleBuy} className="w-full bg-stone-900 text-white rounded-full py-3 font-bold">Buy Now</button>
            <div className="flex gap-2">
              <input value={offer} onChange={e => setOffer(e.target.value)} type="number" min="1" placeholder="Your offer ($)" className="flex-1 border border-stone-300 rounded-full px-4 py-2.5" />
              <button onClick={handleOffer} className="border border-stone-900 rounded-full px-5 font-bold">Make Offer</button>
            </div>
            <button onClick={handleMessage} className="w-full border border-stone-300 rounded-full py-2.5 font-semibold">Message Seller</button>
          </div>
        )}
        {notice && <div className="mt-4 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3 text-sm">{notice}</div>}
        <p className="text-xs text-stone-400 mt-4">Buyer protection: payment is held in escrow and released to the seller 3 days after delivery is confirmed.</p>
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
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr('')
    const r = mode === 'up' ? await s.signUp(email, password, name || email.split('@')[0], type) : await s.signIn(email, password)
    if (r) setErr(r); else go({ name: 'home' })
  }
  return (
    <div className="max-w-md mx-auto bg-white border border-stone-200 rounded-3xl p-8">
      <h1 className="text-2xl font-black mb-1">{mode === 'up' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="text-sm text-stone-500 mb-6">Buy, sell, or both — one account.</p>
      <button onClick={() => s.signInWithGoogle()} className="w-full border border-stone-300 rounded-full py-2.5 font-semibold mb-3 bg-white">
        <span className="font-black mr-2">G</span> Continue with Google
      </button>
      {!isSupabaseConfigured && <p className="text-xs text-stone-400 mb-3">Google sign-in activates when the site is connected to its live accounts backend.</p>}
      <div className="flex items-center gap-3 my-4"><div className="flex-1 border-t border-stone-200" /><span className="text-xs text-stone-400">OR</span><div className="flex-1 border-t border-stone-200" /></div>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'up' && <>
          <input required value={name} onChange={e => setName(e.target.value)} placeholder="Display name" className="w-full border border-stone-300 rounded-xl px-4 py-2.5" />
          <select value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5 bg-white">
            <option value="buyer">Buyer</option><option value="seller">Seller</option><option value="both">Buyer & Seller</option>
          </select>
        </>}
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full border border-stone-300 rounded-xl px-4 py-2.5" />
        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full border border-stone-300 rounded-xl px-4 py-2.5" />
        {err && <div className="text-sm text-red-700">{err}</div>}
        <button className="w-full bg-stone-900 text-white rounded-full py-3 font-bold">{mode === 'up' ? 'Sign up' : 'Sign in'}</button>
      </form>
      <button onClick={() => setMode(mode === 'up' ? 'in' : 'up')} className="text-sm font-semibold mt-4 underline">
        {mode === 'up' ? 'Already have an account? Sign in' : 'New here? Create an account'}
      </button>
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
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-2xl font-black mb-2">Sign in to sell</h1>
      <p className="text-stone-500 mb-5">You need an account so buyers can pay you and message you.</p>
      <button onClick={() => go({ name: 'auth' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">Sign in</button>
    </div>
  )
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await s.addListing({ title: f.title, brand: f.brand, category: f.category, price: parseFloat(f.price) || 0, size: f.size, condition: f.condition, description: f.description, image_url: f.image_url },
      wantVerified ? photos : undefined)
    setDone(true)
  }
  if (done) return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="text-2xl font-black mb-2">Listing published</h1>
      <p className="text-stone-500 mb-5">{wantVerified ? 'Your Verified Authentic request ($5) is in the review queue — the badge appears once approved.' : 'Your item is live on the marketplace.'}</p>
      <button onClick={() => go({ name: 'home' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">View marketplace</button>
    </div>
  )
  const set = (k: string, v: string) => setF(prev => ({ ...prev, [k]: v }))
  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-3xl p-8 space-y-4">
      <h1 className="text-2xl font-black">Sell an item</h1>
      <input required value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title — e.g. Air Jordan 1 Retro High OG 'Chicago'" className="w-full border border-stone-300 rounded-xl px-4 py-2.5" />
      <div className="grid grid-cols-2 gap-3">
        <select value={f.brand} onChange={e => set('brand', e.target.value)} className="border border-stone-300 rounded-xl px-4 py-2.5 bg-white">{BRANDS.map(b => <option key={b}>{b}</option>)}</select>
        <select value={f.category} onChange={e => set('category', e.target.value)} className="border border-stone-300 rounded-xl px-4 py-2.5 bg-white">
          {['Sneakers', 'Streetwear', 'Watches', 'Bags', 'Accessories', 'Designer Luxury'].map(c => <option key={c}>{c}</option>)}
        </select>
        <input required type="number" min="1" value={f.price} onChange={e => set('price', e.target.value)} placeholder="Price ($)" className="border border-stone-300 rounded-xl px-4 py-2.5" />
        <input required value={f.size} onChange={e => set('size', e.target.value)} placeholder="Size" className="border border-stone-300 rounded-xl px-4 py-2.5" />
        <select value={f.condition} onChange={e => set('condition', e.target.value)} className="border border-stone-300 rounded-xl px-4 py-2.5 bg-white">{CONDITIONS.map(c => <option key={c}>{c}</option>)}</select>
        <input value={f.image_url} onChange={e => set('image_url', e.target.value)} placeholder="Photo URL (optional)" className="border border-stone-300 rounded-xl px-4 py-2.5" />
      </div>
      <textarea required value={f.description} onChange={e => set('description', e.target.value)} placeholder="Description — condition details, flaws, box/accessories included…" rows={4} className="w-full border border-stone-300 rounded-xl px-4 py-2.5" />
      <div className="border border-stone-200 rounded-2xl p-4">
        <label className="flex items-start gap-3 font-semibold">
          <input type="checkbox" checked={wantVerified} onChange={e => setWantVerified(e.target.checked)} className="mt-1" />
          <span>Add <span style={{ color: '#10B981' }}>Verified Authentic</span> upgrade — $5<br /><span className="text-sm font-normal text-stone-500">Submit the 5 authentication photos below. A reviewer checks them before the badge goes live.</span></span>
        </label>
        {wantVerified && <div className="mt-4 space-y-2">
          {PHOTO_CHECKLIST.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm w-48">{i + 1}. {label}</span>
              <input value={photos[i]} onChange={e => { const p = [...photos]; p[i] = e.target.value; setPhotos(p) }} placeholder="Photo URL" className="flex-1 border border-stone-300 rounded-xl px-3 py-1.5 text-sm" />
            </div>
          ))}
        </div>}
      </div>
      <button className="w-full bg-stone-900 text-white rounded-full py-3 font-bold">Publish listing</button>
    </form>
  )
}

function Dashboard({ go }: { go: (v: any) => void }) {
  const s = useStore()
  if (!s.user) return <div className="text-center py-16"><button onClick={() => go({ name: 'auth' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">Sign in to view your dashboard</button></div>
  const mine = s.listings.filter(l => l.seller_id === s.user!.id)
  const sales = s.orders.filter(o => o.seller_id === s.user!.id)
  const purchases = s.orders.filter(o => o.buyer_id === s.user!.id)
  const inbox = s.offers.filter(o => o.seller_id === s.user!.id && o.status === 'pending')
  const gross = sales.reduce((a, o) => a + o.amount, 0)
  const fees = sales.reduce((a, o) => a + o.platform_fee, 0)
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black">Seller dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Active listings', String(mine.filter(l => l.status === 'active').length)], ['Total sales', String(sales.length)], ['Gross sales', money(gross)], ['Your payout (after 8% fee)', money(gross - fees)]].map(([k, v]) => (
          <div key={k} className="bg-white border border-stone-200 rounded-2xl p-4"><div className="text-xs uppercase tracking-widest text-stone-500">{k}</div><div className="text-2xl font-black mt-1">{v}</div></div>
        ))}
      </div>

      <section className="bg-white border border-stone-200 rounded-3xl p-6">
        <h2 className="font-black mb-2">Payouts — Stripe Connect</h2>
        {isStripeConfigured
          ? <p className="text-sm text-stone-600">Stripe is connected. Sale funds are held in escrow and released to your connected Stripe account 3 days after delivery.</p>
          : <p className="text-sm text-stone-600">Stripe Connect is not connected yet, so payouts can't be sent. Once the site's Stripe keys are set, you'll onboard with Stripe here and payouts will release 3 days after delivery (after the 8% platform fee).</p>}
      </section>

      <section>
        <h2 className="font-black mb-3">Offers to review</h2>
        {inbox.length === 0 ? <p className="text-stone-500 text-sm">No pending offers.</p> : inbox.map(o => (
          <div key={o.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2 flex items-center gap-3">
            <div className="flex-1"><span className="font-semibold">{o.listing_title}</span> — {money(o.amount)} from {o.buyer_name}</div>
            <button onClick={() => s.respondOffer(o, true)} className="bg-stone-900 text-white rounded-full px-4 py-1.5 text-sm font-semibold">Accept</button>
            <button onClick={() => s.respondOffer(o, false)} className="border border-stone-300 rounded-full px-4 py-1.5 text-sm font-semibold">Decline</button>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black mb-3">Your listings</h2>
        {mine.length === 0 ? <p className="text-stone-500 text-sm">You haven't listed anything yet.</p> : mine.map(l => (
          <div key={l.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2 flex items-center gap-3">
            <div className="flex-1 font-semibold">{l.title} {l.verified && <VerifiedBadge />}<div className="text-sm text-stone-500 font-normal">{money(l.price)} · {l.status}</div></div>
            {l.status === 'active' && <button onClick={() => s.removeListing(l.id)} className="text-sm font-semibold text-red-700">Remove</button>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black mb-3">Your purchases</h2>
        {purchases.length === 0 ? <p className="text-stone-500 text-sm">No purchases yet.</p> : purchases.map(o => (
          <div key={o.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2 text-sm"><span className="font-semibold">{o.listing_title}</span> — {money(o.amount)} · {o.status}</div>
        ))}
      </section>
    </div>
  )
}

function MessagesView({ threadId, go }: { threadId?: string; go: (v: any) => void }) {
  const s = useStore()
  const [activeId, setActiveId] = useState<string | undefined>(threadId)
  const [draft, setDraft] = useState('')
  if (!s.user) return <div className="text-center py-16"><button onClick={() => go({ name: 'auth' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">Sign in to view messages</button></div>
  const mine = s.threads.filter(t => t.buyer_id === s.user!.id || t.seller_id === s.user!.id)
  const active = mine.find(t => t.id === activeId) || mine[0]
  const msgs = active ? s.messages.filter(m => m.thread_id === active.id) : []
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-black mb-2">Messages</h1>
        {mine.length === 0 && <p className="text-stone-500 text-sm">No conversations yet. Message a seller from any listing.</p>}
        {mine.map(t => (
          <button key={t.id} onClick={() => setActiveId(t.id)} className={`w-full text-left bg-white border rounded-2xl p-4 ${active?.id === t.id ? 'border-stone-900' : 'border-stone-200'}`}>
            <div className="font-semibold text-sm">{t.listing_title}</div>
            <div className="text-xs text-stone-500">with {t.buyer_id === s.user!.id ? t.seller_name : t.buyer_name}</div>
          </button>
        ))}
      </div>
      <div className="md:col-span-2 bg-white border border-stone-200 rounded-3xl p-6 flex flex-col min-h-[400px]">
        {active ? <>
          <div className="font-black mb-4">{active.listing_title}</div>
          <div className="flex-1 space-y-2 overflow-auto">
            {msgs.map(m => (
              <div key={m.id} className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === s.user!.id ? 'bg-stone-900 text-white ml-auto' : 'bg-stone-100'}`}>
                <div className="text-[11px] opacity-70">{m.sender_name}</div>{m.body}
              </div>
            ))}
            {msgs.length === 0 && <p className="text-stone-400 text-sm">Say hello to start the conversation.</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { s.sendMessage(active.id, draft); setDraft('') } }} placeholder="Write a message…" className="flex-1 border border-stone-300 rounded-full px-4 py-2.5" />
            <button onClick={() => { s.sendMessage(active.id, draft); setDraft('') }} className="bg-stone-900 text-white rounded-full px-5 font-semibold">Send</button>
          </div>
        </> : <p className="text-stone-400">Select a conversation.</p>}
      </div>
    </div>
  )
}

function WishlistView({ go }: { go: (v: any) => void }) {
  const s = useStore()
  if (!s.user) return <div className="text-center py-16"><button onClick={() => go({ name: 'auth' })} className="bg-stone-900 text-white rounded-full px-6 py-2.5 font-semibold">Sign in to view your wishlist</button></div>
  const items = s.listings.filter(l => s.wishlist.some(w => w.listing_id === l.id && w.user_id === s.user!.id))
  return (
    <div>
      <h1 className="text-3xl font-black mb-5">Wishlist</h1>
      {items.length === 0 ? <p className="text-stone-500">Nothing saved yet.</p> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">{items.map(l => <ListingCard key={l.id} l={l} onOpen={() => go({ name: 'listing', listingId: l.id })} />)}</div>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <h2 className="font-black text-xl mb-2">Owner access</h2>
        <p className="text-sm text-stone-500 mb-4">Enter the owner passcode.</p>
        <input type="password" value={code} onChange={e => setCode(e.target.value)} className="w-full border border-stone-300 rounded-xl px-4 py-2.5 mb-3" placeholder="Passcode" />
        {err && <div className="text-sm text-red-700 mb-3">{err}</div>}
        <button onClick={() => { if (code === OWNER_PASSCODE) onUnlock(); else setErr('Incorrect passcode.') }} className="w-full bg-stone-900 text-white rounded-full py-2.5 font-bold">Unlock</button>
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
    <div className="space-y-8">
      <h1 className="text-3xl font-black">Owner Console</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['GMV (real orders)', money(gmv)], ['Platform revenue (8%)', money(commission)], ['Orders', String(s.orders.length)], ['Accounts', String(s.profiles.length)]].map(([k, v]) => (
          <div key={k} className="bg-white border border-stone-200 rounded-2xl p-4"><div className="text-xs uppercase tracking-widest text-stone-500">{k}</div><div className="text-2xl font-black mt-1">{v}</div></div>
        ))}
      </div>

      <section>
        <h2 className="font-black mb-3">Verification queue</h2>
        {pending.length === 0 ? <p className="text-stone-500 text-sm">No pending verification requests.</p> : pending.map(v => (
          <div key={v.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2">
            <div className="font-semibold">{v.listing_title}</div>
            <div className="text-sm text-stone-500">Seller: {v.seller_name} · {v.photos.filter(Boolean).length}/5 photos submitted</div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => s.reviewVerification(v.id, true, v.listing_title)} className="rounded-full px-4 py-1.5 text-sm font-bold text-white" style={{ background: '#10B981' }}>Approve badge</button>
              <button onClick={() => s.reviewVerification(v.id, false, v.listing_title)} className="border border-stone-300 rounded-full px-4 py-1.5 text-sm font-semibold">Reject</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black mb-3">All listings</h2>
        {s.listings.length === 0 ? <p className="text-stone-500 text-sm">No listings yet.</p> : s.listings.map(l => (
          <div key={l.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2 flex items-center gap-3">
            <div className="flex-1 font-semibold">{l.title} {l.verified && <VerifiedBadge />}<div className="text-sm text-stone-500 font-normal">{money(l.price)} · {l.status} · by {l.seller_name}</div></div>
            {l.status === 'active' && <button onClick={() => s.removeListing(l.id)} className="text-sm font-semibold text-red-700">Remove</button>}
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-black mb-3">Accounts</h2>
        {s.profiles.length === 0 ? <p className="text-stone-500 text-sm">No accounts yet.</p> : s.profiles.map(p => (
          <div key={p.id} className="bg-white border border-stone-200 rounded-2xl p-4 mb-2 flex items-center gap-3">
            <div className="flex-1"><span className="font-semibold">{p.display_name}</span> <span className="text-sm text-stone-500">{p.email} · {p.account_type}{p.banned ? ' · BANNED' : ''}</span></div>
            {!p.is_owner && <button onClick={() => s.setBanned(p.id, !p.banned)} className="text-sm font-semibold">{p.banned ? 'Unban' : 'Ban'}</button>}
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
