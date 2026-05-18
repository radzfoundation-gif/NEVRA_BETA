import { useEffect, useRef } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { auth as firebaseAuth, bridgeClerkToFirebase, signOutFirebase } from '@/lib/firebase';

/**
 * Mounts once near the auth-aware root and keeps Firebase Auth in sync with
 * Clerk. Whenever Clerk reports a signed-in session, we mint a Firebase custom
 * token via Clerk's "firebase" JWT template and sign into Firebase, so
 * Firestore Security Rules can use `request.auth.uid === clerkUserId`.
 *
 * Required Clerk setup (one-time, manual):
 *   Clerk Dashboard → JWT Templates → New → preset "firebase" → audience =
 *   <Firebase project_id>. Save the template name "firebase".
 */
export function useFirebaseAuthBridge(): void {
    const clerk = useClerkAuth();
    const lastUidRef = useRef<string | null>(null);

    useEffect(() => {
        if (!firebaseAuth) return;
        if (!clerk.isLoaded) return;

        const sync = async () => {
            // Signed out → ensure Firebase is signed out too.
            if (!clerk.isSignedIn) {
                if (firebaseAuth.currentUser) await signOutFirebase();
                lastUidRef.current = null;
                return;
            }

            // Already bridged for this Clerk userId → no-op.
            if (firebaseAuth.currentUser && lastUidRef.current === clerk.userId) return;

            try {
                const token = await clerk.getToken({ template: 'firebase' });
                if (!token) {
                    if (typeof window !== 'undefined') {
                        console.warn('[Firebase bridge] Clerk did not return a token. Did you create the "firebase" JWT template in Clerk Dashboard?');
                    }
                    return;
                }
                const ok = await bridgeClerkToFirebase(token);
                if (ok) lastUidRef.current = clerk.userId;
            } catch (err) {
                console.error('[Firebase bridge] sync failed:', err);
            }
        };

        sync();
        // Refresh the Firebase token periodically because Clerk JWTs are
        // short-lived. Re-running sync re-mints if needed.
        const interval = window.setInterval(sync, 4 * 60 * 1000); // 4 min
        return () => window.clearInterval(interval);
    }, [clerk.isLoaded, clerk.isSignedIn, clerk.userId, clerk.getToken]);
}
