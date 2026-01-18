import React, { useState, useEffect } from 'react';
import Footer from '../Footer';
import Background from '../ui/Background';
import { Check } from 'lucide-react';
import { detectCurrency, getPremiumPricing, formatCurrency } from '@/lib/currency';
import { useUser } from '@/lib/authContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const PricingPage: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'IDR'>('USD');
  const [loadingCurrency, setLoadingCurrency] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check for success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setError(null);
      // Refresh subscription status
      if (user?.id) {
        checkSubscriptionStatus();
      }
      // Remove query params
      navigate('/pricing', { replace: true });
    } else if (canceled === 'true') {
      setError('Payment was canceled. You can try again anytime.');
      navigate('/pricing', { replace: true });
    }
  }, [searchParams, user, navigate]);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;

    try {
      const resp = await fetch(`/api/payment/subscription?userId=${user.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setIsSubscribed(data.isActive);
      }
    } catch (e) {
      console.error('Error checking subscription:', e);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkSubscriptionStatus();
    }
  }, [user?.id]);

  useEffect(() => {
    // Handle payment success callback
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');

    if (success === 'true' && user?.id) {
      // Wait a bit then refresh subscription
      setTimeout(() => {
        checkSubscriptionStatus();
        window.history.replaceState({}, '', '/pricing');
      }, 1000);
    }
  }, [user?.id]);

  useEffect(() => {
    // Detect currency on mount
    detectCurrency().then((info) => {
      setCurrency(info.currency);
      setLoadingCurrency(false);
    }).catch(() => {
      setCurrency('USD');
      setLoadingCurrency(false);
    });
  }, []);

  const premiumPricing = getPremiumPricing(currency);

  const handleCheckout = async (plan: 'free' | 'premium') => {
    if (plan === 'free') {
      // Free plan - no payment needed
      return;
    }

    // Check if user is signed in
    if (!isSignedIn || !user) {
      setError('Please sign in to subscribe to Premium');
      navigate('/sign-in', { state: { from: '/pricing' } });
      return;
    }

    setError(null);
    setLoadingPlan(plan);
    try {
      const resp = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'premium',
          currency,
          amount: premiumPricing.amount,
          userId: user.id,
        }),
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ error: 'Failed to create checkout session' }));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      const data = await resp.json();
      if (data?.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else if (data?.token) {
        // Use Midtrans Snap
        // @ts-ignore - Midtrans Snap is loaded from CDN
        if (window.snap) {
          // @ts-ignore
          window.snap.pay(data.token, {
            onSuccess: async function (result: any) {
              console.log('✅ Payment success:', result);

              // Auto-activate subscription
              try {
                const activateResp = await fetch('/api/payment/activate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: user.id,
                    orderId: result.order_id || data.order_id,
                  }),
                });

                if (activateResp.ok) {
                  const activateData = await activateResp.json();
                  console.log('✅ Auto-activation successful:', activateData);

                  // Update local state immediately
                  setIsSubscribed(true);
                  setLoadingPlan(null);

                  // Show success message
                  alert('🎉 Selamat! Subscription Premium Anda berhasil diaktifkan!');
                } else {
                  const errorData = await activateResp.json();
                  console.error('❌ Auto-activation failed:', errorData);
                  alert('Payment berhasil, tapi aktivasi gagal. Silakan hubungi support.');
                }
              } catch (error) {
                console.error('❌ Activation error:', error);
                alert('Payment berhasil, tapi aktivasi gagal. Silakan hubungi support.');
              }

              // Redirect to success page
              window.location.href = '/pricing?success=true';
            },
            onPending: function (result: any) {
              console.log('⏳ Payment pending:', result);
              window.location.href = '/pricing?pending=true';
            },
            onError: function (result: any) {
              console.error('❌ Payment error:', result);
              window.location.href = '/pricing?error=true';
            },
            onClose: function () {
              console.log('🚪 Payment popup closed');
              setLoadingPlan(null);
            }
          });
        } else {
          // Fallback to redirect
          window.location.href = data.checkout_url;
        }
      } else {
        throw new Error('Invalid checkout response');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unable to start checkout. Please try again.';
      setError(errorMessage);
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!isSignedIn || !user) {
      setError('Please sign in to manage your subscription');
      return;
    }

    setError(null);
    setLoadingPlan('manage');
    try {
      const resp = await fetch('/api/payment/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!resp.ok) {
        throw new Error('Failed to fetch subscription info');
      }

      const data = await resp.json();

      // Show subscription info in alert
      if (data.subscription) {
        const expiryDate = new Date(data.subscription.expiresAt).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        alert(`🎉 Subscription Aktif!\n\nTier: Nevra Pro\nAktif sejak: ${new Date(data.subscription.activatedAt).toLocaleDateString('id-ID')}\nBerlaku hingga: ${expiryDate}\n\nNikmati unlimited tokens dan semua fitur premium!`);
      }

      setLoadingPlan(null);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unable to fetch subscription info';
      setError(errorMessage);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden text-aura-primary bg-[#020202] page-transition">
      <Background />
      <main className="flex-grow pt-24 relative z-10">
        <section className="relative py-20 px-6">
          <div className="max-w-7xl mx-auto text-center mb-12 md:mb-16 px-4">
            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 md:mb-6 text-white tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
            {loadingCurrency ? (
              <p className="text-sm text-gray-500 mt-2">Detecting your location...</p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                Prices shown in {currency === 'IDR' ? 'Indonesian Rupiah' : 'US Dollars'}
              </p>
            )}
          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4">
            {/* Free Plan */}
            <div className="p-6 md:p-8 rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Free</h3>
                <div className="text-3xl font-bold text-white mt-2">
                  {formatCurrency(0, currency)} <span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '200 AI Tokens/month',
                  'Basic AI Models (Groq, Deepseek)',
                  'Community Support',
                  '7-day Chat History',
                  'Builder & Tutor Mode',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                    <Check className="w-4 h-4 text-white" /> {item}
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-3.5 md:py-3 rounded-lg border border-white/20 text-white hover:bg-white hover:text-black transition-colors font-medium min-h-[44px] flex items-center justify-center"
                onClick={() => handleCheckout('free')}
                disabled={loadingPlan === 'free'}>
                {loadingPlan === 'free' ? 'Processing...' : 'Start Free'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="p-6 md:p-8 rounded-2xl bg-[#111] border border-purple-500/50 relative flex flex-col shadow-2xl shadow-purple-900/20">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                Most Popular
              </div>
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">Premium</h3>
                <div className="text-3xl font-bold text-white mt-2">
                  {premiumPricing.formatted} <span className="text-sm font-normal text-gray-500">/mo</span>
                </div>
                {currency === 'IDR' && (
                  <p className="text-xs text-gray-500 mt-1">≈ $3 USD</p>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Unlimited AI Tokens',
                  'All AI Models (GPT-4o, Gemini, Kimi K2)',
                  'Priority Support',
                  'Unlimited Chat History',
                  'Advanced Code Generation',
                  'Export Projects',
                  'Agentic Planning',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                    <Check className="w-4 h-4 text-purple-400" /> {item}
                  </li>
                ))}
              </ul>
              {isSubscribed ? (
                <button
                  className="w-full py-3.5 md:py-3 rounded-lg bg-green-600 text-white hover:bg-green-500 transition-colors font-medium shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === 'manage' || loadingCurrency}>
                  {loadingPlan === 'manage' ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <button
                  className="w-full py-3.5 md:py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                  onClick={() => handleCheckout('premium')}
                  disabled={loadingPlan === 'premium' || loadingCurrency}>
                  {loadingPlan === 'premium' ? 'Processing...' : 'Get Premium'}
                </button>
              )}
            </div>
          </div>
          {error && (
            <div className="max-w-3xl mx-auto mt-6 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
