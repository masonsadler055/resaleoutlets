import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

// ---------------------------------------------------------------------------
// Types (mirror supabase/schema.sql)
// ---------------------------------------------------------------------------
export type AccountType = 'buyer' | 'seller' | 'both'
export interface Profile { id: string; email: string; display_name: string; account_type: AccountType; is_owner?: boolean; banned?: boolean }
export interface Listing { id: string; seller_id: string; seller_name: string; title: string; brand: string; category: string; price: number; size: string; condition: string; description: string; image_url: string; verified: boolean; status: 'active' | 'sold' | 'removed'; created_at: string }
export interface Order { id: string; listing_id: string; listing_title: string; buyer_id: string; seller_id: string; amount: number; platform_fee: number; status: string; created_at: string }
export interface Offer { id: string; listing_id: string; listing_title: string; buyer_id: string; buyer_name: string; seller_id: string; amount: number; status: 'pending' | 'accepted' | 'declined'; created_at: string }
export interface Thread { id: string; listing_id: string | null; listing_title: string; buyer_id: string; buyer_name: string; seller_id: string; seller_name: string; created_at: string }
export interface Message { id: string; thread_id: string; sender_id: string; sender_name: string; body: string; created_at: string }
export interface VerificationRequest { id: string; listing_title: string; seller_id: string; seller_name: string; photos: string[]; status: 'pending' | 'approved' | 'rejected'; created_at: string }
export interface WishlistRow { id: string; user_id: string; listing_id: string }

export const BRANDS = ['Nike', 'Jordan', 'Balenciaga', 'Supreme', 'Louis Vuitton', 'Off-White', 'Yeezy', 'BAPE', 'Chrome Hearts', 'Designer Luxury']
export const CONDITIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair']
export const PHOTO_CHECKLIST = ['Front view', 'Back view', 'Size tag / label', 'Logo / branding close-up', 'Sole / details close-up']

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const now = () => new Date().toISOString()

// ---------------------------------------------------------------------------
// Local fallback persistence (ONLY used when Supabase env vars are absent).
// Starts completely empty: zero listings, zero orders — stats are always
// computed from whatever real rows exist, never seeded.
// ---------------------------------------------------------------------------
const LS_KEY = 'resaleoutlets.local.v1'
interface LocalDb { profiles: Profile[]; passwords: Record<string, string>; listings: Listing[]; orders: Order[]; offers: Offer[]; threads: Thread[]; messages: Message[]; verification: VerificationRequest[]; wishlist: WishlistRow[]; sessionUserId: string | null }
const emptyDb = (): LocalDb => ({ profiles: [], passwords: {}, listings: [], orders: [], offers: [], threads: [], messages: [], verification: [], wishlist: [], sessionUserId: null })
function loadDb(): LocalDb { try { const raw = localStorage.getItem(LS_KEY); if (raw) return { ...emptyDb(), ...JSON.parse(raw) } } catch { /* storage unavailable */ } return emptyDb() }
function saveDb(db: LocalDb) { try { localStorage.setItem(LS_KEY, JSON.stringify(db)) } catch { /* ignore */ } }

interface Store {
  user: Profile | null
  listings: Listing[]; orders: Order[]; offers: Offer[]; threads: Thread[]; messages: Message[]
  verification: VerificationRequest[]; wishlist: WishlistRow[]; profiles: Profile[]
  loading: boolean
  signUp: (email: string, password: string, name: string, type: AccountType) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  addListing: (l: Omit<Listing, 'id' | 'created_at' | 'status' | 'seller_id' | 'seller_name' | 'verified'>, verificationPhotos?: string[]) => Promise<void>
  removeListing: (id: string) => Promise<void>
  buyNow: (l: Listing) => Promise<Order | null>
  makeOffer: (l: Listing, amount: number) => Promise<void>
  respondOffer: (o: Offer, accept: boolean) => Promise<void>
  startThread: (l: Listing) => Promise<string | null>
  sendMessage: (threadId: string, body: string) => Promise<void>
  toggleWishlist: (listingId: string) => Promise<void>
  reviewVerification: (id: string, approve: boolean, listingTitle: string) => Promise<void>
  setBanned: (profileId: string, banned: boolean) => Promise<void>
  updateProfile: (name: string, type: AccountType) => Promise<void>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error('store missing'); return s }

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [verification, setVerification] = useState<VerificationRequest[]>([])
  const [wishlist, setWishlist] = useState<WishlistRow[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const dbRef = useRef<LocalDb>(loadDb())

  const persistLocal = useCallback(() => {
    const db = dbRef.current
    saveDb(db)
    setListings([...db.listings]); setOrders([...db.orders]); setOffers([...db.offers])
    setThreads([...db.threads]); setMessages([...db.messages]); setVerification([...db.verification])
    setWishlist([...db.wishlist]); setProfiles([...db.profiles])
    setUser(db.profiles.find(p => p.id === db.sessionUserId) || null)
  }, [])

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) { persistLocal(); setLoading(false); return }
    const [li, or, of, th, me, ve, wi] = await Promise.all([
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('threads').select('*').order('created_at', { ascending: false }),
      supabase.from('messages').select('*').order('created_at', { ascending: true }),
      supabase.from('verification_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('wishlist').select('*'),
    ])
    if (li.data) setListings(li.data as Listing[])
    if (or.data) setOrders(or.data as Order[])
    if (of.data) setOffers(of.data as Offer[])
    if (th.data) setThreads(th.data as Thread[])
    if (me.data) setMessages(me.data as Message[])
    if (ve.data) setVerification(ve.data as VerificationRequest[])
    if (wi.data) setWishlist(wi.data as WishlistRow[])
    const { data: sess } = await supabase.auth.getSession()
    const au = sess.session?.user
    if (au) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', au.id).single()
      if (prof) setUser(prof as Profile)
      const { data: all } = await supabase.from('profiles').select('*')
      if (all) setProfiles(all as Profile[])
    } else setUser(null)
    setLoading(false)
  }, [persistLocal])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!supabase) return
    const { data: sub } = supabase.auth.onAuthStateChange(() => { refresh() })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  // ------------------------------------------------------------- auth
  const signUp = useCallback(async (email: string, password: string, name: string, type: AccountType) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return error.message
      if (data.user) await supabase.from('profiles').insert({ id: data.user.id, email, display_name: name, account_type: type })
      await refresh(); return null
    }
    const db = dbRef.current
    if (db.profiles.some(p => p.email.toLowerCase() === email.toLowerCase())) return 'An account with this email already exists.'
    const prof: Profile = { id: uid(), email, display_name: name, account_type: type }
    db.profiles.push(prof); db.passwords[prof.id] = password; db.sessionUserId = prof.id
    persistLocal(); return null
  }, [refresh, persistLocal])

  const signIn = useCallback(async (email: string, password: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return error.message
      await refresh(); return null
    }
    const db = dbRef.current
    const prof = db.profiles.find(p => p.email.toLowerCase() === email.toLowerCase())
    if (!prof || db.passwords[prof.id] !== password) return 'Invalid email or password.'
    if (prof.banned) return 'This account has been suspended.'
    db.sessionUserId = prof.id; persistLocal(); return null
  }, [refresh, persistLocal])

  const signInWithGoogle = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    }
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) { await supabase.auth.signOut(); setUser(null); await refresh(); return }
    dbRef.current.sessionUserId = null; persistLocal()
  }, [refresh, persistLocal])

  // ------------------------------------------------------------- marketplace
  const addListing: Store['addListing'] = useCallback(async (l, verificationPhotos) => {
    if (!user) return
    const row: Listing = { ...l, id: uid(), seller_id: user.id, seller_name: user.display_name, verified: false, status: 'active', created_at: now() }
    if (supabase) {
      const { data } = await supabase.from('listings').insert({ seller_id: row.seller_id, seller_name: row.seller_name, title: row.title, brand: row.brand, category: row.category, price: row.price, size: row.size, condition: row.condition, description: row.description, image_url: row.image_url, verified: false, status: 'active' }).select().single()
      if (verificationPhotos && data) await supabase.from('verification_requests').insert({ listing_id: data.id, listing_title: row.title, seller_id: user.id, seller_name: user.display_name, photos: verificationPhotos, status: 'pending' })
      await refresh(); return
    }
    const db = dbRef.current; db.listings.unshift(row)
    if (verificationPhotos) db.verification.unshift({ id: uid(), listing_title: row.title, seller_id: user.id, seller_name: user.display_name, photos: verificationPhotos, status: 'pending', created_at: now() })
    persistLocal()
  }, [user, refresh, persistLocal])

  const removeListing = useCallback(async (id: string) => {
    if (supabase) { await supabase.from('listings').update({ status: 'removed' }).eq('id', id); await refresh(); return }
    const db = dbRef.current; const l = db.listings.find(x => x.id === id); if (l) l.status = 'removed'; persistLocal()
  }, [refresh, persistLocal])

  const buyNow = useCallback(async (l: Listing) => {
    if (!user) return null
    const fee = Math.round(l.price * 0.08 * 100) / 100
    const order: Order = { id: uid(), listing_id: l.id, listing_title: l.title, buyer_id: user.id, seller_id: l.seller_id, amount: l.price, platform_fee: fee, status: 'paid — held in escrow', created_at: now() }
    if (supabase) {
      const { data } = await supabase.from('orders').insert({ listing_id: l.id, listing_title: l.title, buyer_id: user.id, seller_id: l.seller_id, amount: l.price, platform_fee: fee, status: order.status }).select().single()
      await supabase.from('listings').update({ status: 'sold' }).eq('id', l.id)
      await refresh(); return (data as Order) || order
    }
    const db = dbRef.current; db.orders.unshift(order); const li = db.listings.find(x => x.id === l.id); if (li) li.status = 'sold'; persistLocal(); return order
  }, [user, refresh, persistLocal])

  const makeOffer = useCallback(async (l: Listing, amount: number) => {
    if (!user) return
    if (supabase) { await supabase.from('offers').insert({ listing_id: l.id, listing_title: l.title, buyer_id: user.id, buyer_name: user.display_name, seller_id: l.seller_id, amount, status: 'pending' }); await refresh(); return }
    dbRef.current.offers.unshift({ id: uid(), listing_id: l.id, listing_title: l.title, buyer_id: user.id, buyer_name: user.display_name, seller_id: l.seller_id, amount, status: 'pending', created_at: now() }); persistLocal()
  }, [user, refresh, persistLocal])

  const respondOffer = useCallback(async (o: Offer, accept: boolean) => {
    if (supabase) {
      await supabase.from('offers').update({ status: accept ? 'accepted' : 'declined' }).eq('id', o.id)
      if (accept) {
        const fee = Math.round(o.amount * 0.08 * 100) / 100
        await supabase.from('orders').insert({ listing_id: o.listing_id, listing_title: o.listing_title, buyer_id: o.buyer_id, seller_id: o.seller_id, amount: o.amount, platform_fee: fee, status: 'paid — held in escrow' })
        await supabase.from('listings').update({ status: 'sold' }).eq('id', o.listing_id)
      }
      await refresh(); return
    }
    const db = dbRef.current; const row = db.offers.find(x => x.id === o.id); if (row) row.status = accept ? 'accepted' : 'declined'
    if (accept && row) {
      db.orders.unshift({ id: uid(), listing_id: row.listing_id, listing_title: row.listing_title, buyer_id: row.buyer_id, seller_id: row.seller_id, amount: row.amount, platform_fee: Math.round(row.amount * 0.08 * 100) / 100, status: 'paid — held in escrow', created_at: now() })
      const li = db.listings.find(x => x.id === row.listing_id); if (li) li.status = 'sold'
    }
    persistLocal()
  }, [refresh, persistLocal])

  const startThread = useCallback(async (l: Listing) => {
    if (!user) return null
    const existing = threads.find(t => t.listing_id === l.id && t.buyer_id === user.id)
    if (existing) return existing.id
    if (supabase) {
      const { data } = await supabase.from('threads').insert({ listing_id: l.id, listing_title: l.title, buyer_id: user.id, buyer_name: user.display_name, seller_id: l.seller_id, seller_name: l.seller_name }).select().single()
      await refresh(); return data ? (data as Thread).id : null
    }
    const t: Thread = { id: uid(), listing_id: l.id, listing_title: l.title, buyer_id: user.id, buyer_name: user.display_name, seller_id: l.seller_id, seller_name: l.seller_name, created_at: now() }
    dbRef.current.threads.unshift(t); persistLocal(); return t.id
  }, [user, threads, refresh, persistLocal])

  const sendMessage = useCallback(async (threadId: string, body: string) => {
    if (!user || !body.trim()) return
    if (supabase) { await supabase.from('messages').insert({ thread_id: threadId, sender_id: user.id, sender_name: user.display_name, body }); await refresh(); return }
    dbRef.current.messages.push({ id: uid(), thread_id: threadId, sender_id: user.id, sender_name: user.display_name, body, created_at: now() }); persistLocal()
  }, [user, refresh, persistLocal])

  const toggleWishlist = useCallback(async (listingId: string) => {
    if (!user) return
    const existing = wishlist.find(w => w.listing_id === listingId && w.user_id === user.id)
    if (supabase) {
      if (existing) await supabase.from('wishlist').delete().eq('id', existing.id)
      else await supabase.from('wishlist').insert({ user_id: user.id, listing_id: listingId })
      await refresh(); return
    }
    const db = dbRef.current
    if (existing) db.wishlist = db.wishlist.filter(w => w.id !== existing.id)
    else db.wishlist.push({ id: uid(), user_id: user.id, listing_id: listingId })
    persistLocal()
  }, [user, wishlist, refresh, persistLocal])

  const reviewVerification = useCallback(async (id: string, approve: boolean, listingTitle: string) => {
    if (supabase) {
      await supabase.from('verification_requests').update({ status: approve ? 'approved' : 'rejected' }).eq('id', id)
      if (approve) await supabase.from('listings').update({ verified: true }).eq('title', listingTitle)
      await refresh(); return
    }
    const db = dbRef.current; const r = db.verification.find(x => x.id === id); if (r) r.status = approve ? 'approved' : 'rejected'
    if (approve) { const l = db.listings.find(x => x.title === listingTitle); if (l) l.verified = true }
    persistLocal()
  }, [refresh, persistLocal])

  const updateProfile = useCallback(async (name: string, type: AccountType) => {
    if (!user) return
    if (supabase) { await supabase.from('profiles').update({ display_name: name, account_type: type }).eq('id', user.id); await refresh(); return }
    const db = dbRef.current; const p = db.profiles.find(x => x.id === user.id); if (p) { p.display_name = name; p.account_type = type } persistLocal()
  }, [user, refresh, persistLocal])

  const setBanned = useCallback(async (profileId: string, banned: boolean) => {
    if (supabase) { await supabase.from('profiles').update({ banned }).eq('id', profileId); await refresh(); return }
    const db = dbRef.current; const p = db.profiles.find(x => x.id === profileId); if (p) p.banned = banned; persistLocal()
  }, [refresh, persistLocal])

  const value = useMemo<Store>(() => ({ user, listings, orders, offers, threads, messages, verification, wishlist, profiles, loading, signUp, signIn, signInWithGoogle, signOut, refresh, addListing, removeListing, buyNow, makeOffer, respondOffer, startThread, sendMessage, toggleWishlist, reviewVerification, setBanned, updateProfile }),
    [user, listings, orders, offers, threads, messages, verification, wishlist, profiles, loading, signUp, signIn, signInWithGoogle, signOut, refresh, addListing, removeListing, buyNow, makeOffer, respondOffer, startThread, sendMessage, toggleWishlist, reviewVerification, setBanned, updateProfile])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
