"use client";
// BankAuth — the account layer of the bank mock catalog.
//
// One Firebase session serves BOTH surfaces: these Next.js catalog pages AND
// the React-Native CBT player at /bank/mock/* are the same origin, so a
// sign-in here is visible to the player (and vice versa). Same Firebase
// project as the Android apps ⇒ same uid ⇒ purchases registered by the app
// unlock on this site — nobody ever re-proves a purchase on the web.
//
// Entitlement is read from the studyvirus-api worker, which validated every
// purchase against Google Play; the client never asserts what it owns.
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const API = "https://studyvirus-api.futurebanker11.workers.dev";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDFC2tCgQ_jaWIuWEBACsgnyJVYjDYGd6w",
  authDomain: "study-virus-wordpress-app.firebaseapp.com",
  projectId: "study-virus-wordpress-app",
  storageBucket: "study-virus-wordpress-app.firebasestorage.app",
  messagingSenderId: "205062136316",
  appId: "1:205062136316:web:adce89881134a734d39279",
};

export type Grants = {
  adFree: boolean;
  pro: boolean;
  pass: boolean;
  exams: string[];
  skus: string[];
  expiresAt?: string | null;
};

type BankAuthState = {
  email: string | null;
  grants: Grants | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const Ctx = createContext<BankAuthState>({
  email: null,
  grants: null,
  loading: true,
  signIn: async () => {},
  signOutUser: async () => {},
});

export const useBankAuth = () => useContext(Ctx);

async function getFirebaseAuth() {
  const { initializeApp, getApps } = await import("firebase/app");
  const { getAuth } = await import("firebase/auth");
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return getAuth(app);
}

export function BankAuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [grants, setGrants] = useState<Grants | null>(null);
  const [loading, setLoading] = useState(true);

  const pullGrants = useCallback(async () => {
    try {
      const auth = await getFirebaseAuth();
      const u = auth.currentUser;
      if (!u) { setGrants(null); return; }
      const token = await u.getIdToken(false);
      const res = await fetch(`${API}/api/entitlement`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: "{}",
      });
      if (res.ok) setGrants((await res.json()) as Grants);
    } catch { /* network — leave grants as-is, never strip access on error */ }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        const { onAuthStateChanged, getRedirectResult } = await import("firebase/auth");
        // Complete a redirect sign-in if we're returning from Google. This must run
        // before/alongside the auth listener so the returned credential is consumed;
        // onAuthStateChanged then fires with the signed-in user. Ignore "no redirect
        // pending" (the normal case on a fresh visit).
        getRedirectResult(auth).catch(() => { /* no pending redirect */ });
        unsub = onAuthStateChanged(auth, (u) => {
          setEmail(u?.email || null);
          setLoading(false);
          if (u) pullGrants(); else setGrants(null);
        });
      } catch { setLoading(false); }
    })();
    return () => { if (unsub) unsub(); };
  }, [pullGrants]);

  // REDIRECT sign-in, not popup. The popup opens a separate Chrome window titled
  // with the Firebase project id ("study-virus-wordpress-app.firebaseapp.com"),
  // which reads as an unbranded/suspicious app to students. Redirect keeps
  // studyvirus.com in the address bar the whole time — the tab goes to Google and
  // returns to studyvirus.com — so the firebaseapp.com title never surfaces.
  // The result is picked up by getRedirectResult on the next load; onAuthStateChanged
  // then fires and updates email + grants.
  const signIn = useCallback(async () => {
    try {
      const auth = await getFirebaseAuth();
      const { GoogleAuthProvider, signInWithRedirect } = await import("firebase/auth");
      await signInWithRedirect(auth, new GoogleAuthProvider());
      // Navigates away; control resumes on return via getRedirectResult (below).
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      if (code === "auth/unauthorized-domain") {
        alert("Sign-in is being set up for this site. Please try again later.");
      }
      /* cancelled — no-op */
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      const auth = await getFirebaseAuth();
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
    } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ email, grants, loading, signIn, signOutUser }}>
      {children}
    </Ctx.Provider>
  );
}

// The bank pages' account bar — brand left, SIGN IN top-right (or the account
// chip with plan + sign-out once signed in).
export function BankBar() {
  const { email, grants, loading, signIn, signOutUser } = useBankAuth();
  const plan = grants?.pass ? "Bank Pass" : grants?.pro ? "Bank Pro" : null;

  return (
    <div className="flex items-center justify-between gap-3 bg-[#0f2540] text-white rounded-2xl px-4 py-3 mb-5">
      <a href="/bank" className="flex items-center gap-2 min-w-0">
        <span className="text-xl">🏦</span>
        <span className="font-black tracking-tight">BankPrep Mock Tests</span>
      </a>
      {loading ? (
        <span className="text-xs text-white/60">…</span>
      ) : email ? (
        <div className="flex items-center gap-2 min-w-0">
          {plan && (
            <span className="hidden sm:inline-block text-[11px] font-extrabold bg-amber-400 text-amber-950 rounded-full px-2.5 py-1">
              {plan}
            </span>
          )}
          <span className="text-xs text-white/85 truncate max-w-[160px] sm:max-w-[240px]">{email}</span>
          <button onClick={signOutUser} className="text-[11px] text-white/60 hover:text-white underline shrink-0">
            Sign out
          </button>
        </div>
      ) : (
        <button
          onClick={signIn}
          className="bg-white text-[#0f2540] text-sm font-extrabold rounded-xl px-4 py-2 hover:bg-blue-50 shrink-0"
        >
          Sign in
        </button>
      )}
    </div>
  );
}
