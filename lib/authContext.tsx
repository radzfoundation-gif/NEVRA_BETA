import React from 'react';
import {
    ClerkProvider,
    useAuth as useClerkAuth,
    useClerk,
    useSignIn,
    useSignUp,
    useUser as useClerkUser,
} from '@clerk/clerk-react';

interface ClerkCompatibleUser {
    id: string;
    emailAddresses: { emailAddress: string }[];
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    primaryEmailAddress?: { emailAddress: string };
    nickname: string | null;
}

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const toCompatibleUser = (clerkUser: any): ClerkCompatibleUser | null => {
    if (!clerkUser) return null;
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const nickname = (clerkUser.unsafeMetadata?.nickname || clerkUser.publicMetadata?.nickname || clerkUser.username || clerkUser.firstName || '') as string;
    return {
        id: clerkUser.id,
        emailAddresses: (clerkUser.emailAddresses || []).map((email: any) => ({ emailAddress: email.emailAddress })),
        fullName: clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || primaryEmail,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
        primaryEmailAddress: primaryEmail ? { emailAddress: primaryEmail } : undefined,
        nickname: nickname || null,
    };
};

const MissingClerkKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-semibold">Clerk belum dikonfigurasi</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
                Tambahkan <code className="rounded bg-zinc-100 px-1 py-0.5">VITE_CLERK_PUBLISHABLE_KEY</code> ke <code className="rounded bg-zinc-100 px-1 py-0.5">.env.local</code>, lalu restart dev server.
            </p>
            <div className="mt-6 w-full rounded-2xl border border-zinc-200 bg-white p-4 text-left text-sm text-zinc-600">
                <p>Contoh:</p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-zinc-950 p-3 text-xs text-white">VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</pre>
            </div>
        </div>
    </div>
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!publishableKey) return <MissingClerkKey>{children}</MissingClerkKey>;
    return (
        <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
            {children}
        </ClerkProvider>
    );
};

export function useUser() {
    const { user, isLoaded, isSignedIn } = useClerkUser();
    const compatibleUser = React.useMemo(() => toCompatibleUser(user), [user?.id, user?.updatedAt]);
    return { user: compatibleUser, isLoaded, isSignedIn: Boolean(isSignedIn) };
}

export function useSession() {
    const auth = useClerkAuth();
    return {
        session: auth.sessionId ? { access_token: auth.sessionId, user: { id: auth.userId } } : null,
        isLoaded: auth.isLoaded,
    };
}

export function useAuth() {
    const clerkAuth = useClerkAuth();
    const clerk = useClerk();
    const { signIn, setActive: setSignInActive } = useSignIn();
    const { signUp, setActive: setSignUpActive } = useSignUp();
    const { user } = useClerkUser();

    const signInWithPassword = async (email: string, password: string) => {
        try {
            if (!signIn) throw new Error('Clerk sign-in is not ready');
            const result = await signIn.create({ identifier: email, password });
            if (result.status === 'complete') {
                await setSignInActive({ session: result.createdSessionId });
                return { error: null };
            }
            return { error: new Error('Sign in requires additional verification in Clerk.') };
        } catch (error: any) {
            return { error: new Error(error?.errors?.[0]?.message || error?.message || 'Unable to sign in') };
        }
    };

    const signUpWithPassword = async (email: string, password: string, fullName?: string) => {
        try {
            if (!signUp) throw new Error('Clerk sign-up is not ready');
            const [firstName, ...rest] = (fullName || '').trim().split(' ').filter(Boolean);
            const result = await signUp.create({
                emailAddress: email,
                password,
                firstName: firstName || undefined,
                lastName: rest.join(' ') || undefined,
            });
            if (result.status === 'complete') {
                await setSignUpActive({ session: result.createdSessionId });
                return { error: null };
            }
            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            return { error: new Error('Check your email for the Clerk verification code, then complete verification in Clerk.') };
        } catch (error: any) {
            return { error: new Error(error?.errors?.[0]?.message || error?.message || 'Unable to sign up') };
        }
    };

    const signInWithGoogle = async () => {
        await clerk.openSignIn({ redirectUrl: window.location.href, signUpUrl: '/sign-up' });
    };

    const resetPassword = async (email: string) => {
        try {
            if (!signIn) throw new Error('Clerk sign-in is not ready');
            await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
            return { error: null };
        } catch (error: any) {
            return { error: new Error(error?.errors?.[0]?.message || error?.message || 'Unable to send reset email') };
        }
    };

    const updateProfile = async (data: { nickname?: string; fullName?: string }) => {
        try {
            if (!user) throw new Error('Not signed in');
            const updates: any = {};
            if (data.fullName) {
                const [firstName, ...rest] = data.fullName.trim().split(' ');
                updates.firstName = firstName;
                updates.lastName = rest.join(' ') || undefined;
            }
            if (data.nickname) updates.unsafeMetadata = { ...user.unsafeMetadata, nickname: data.nickname };
            await user.update(updates);
            await user.reload();
            return { error: null };
        } catch (error: any) {
            return { error: new Error(error?.errors?.[0]?.message || error?.message || 'Unable to update profile') };
        }
    };

    return {
        userId: clerkAuth.userId,
        isLoaded: clerkAuth.isLoaded,
        isSignedIn: Boolean(clerkAuth.isSignedIn),
        signOut: () => clerk.signOut(),
        getToken: clerkAuth.getToken,
        signIn: signInWithPassword,
        signUp: signUpWithPassword,
        signInWithGoogle,
        resetPassword,
        updateProfile,
    };
}

export function useAuthContext() {
    const userState = useUser();
    const authState = useAuth();
    return { ...userState, ...authState, supabaseUser: null, session: null };
}

export default null;
