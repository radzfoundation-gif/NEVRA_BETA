import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Sparkles, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser, useAuth } from '@/lib/authContext';
import { cn } from '@/lib/utils';
import Logo from './Logo';
import { ProStatusIndicator } from './ui/ProFeatureGate';

const Navbar: React.FC = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', path: '/features' },
    { name: 'Agents', path: '/agents' },
    { name: 'Enterprise', path: '/enterprise' },
    { name: 'Pricing', path: '/pricing' },
  ];

  const getUserInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      return names.length >= 2
        ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
        : user.fullName.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between">
          {/* 1. Brand / Logo */}
          <div className="flex items-center gap-10">
            <Link
              to="/"
              className="flex items-center gap-2 group"
              aria-label="Noir Home"
            >
              <Logo size={28} className="text-zinc-900 dark:text-white" />
            </Link>
          </div>

          {/* 2. Centered Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-xs font-semibold tracking-wider text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors uppercase"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {/* Signed Out State */}
            {isLoaded && !isSignedIn && (
              <>
                <Link
                  to="/sign-in"
                  className="text-sm font-medium text-zinc-900 dark:text-white hover:opacity-80 transition-opacity"
                >
                  Log in
                </Link>
                <Link
                  to="/sign-up"
                  className="hidden md:flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Start Building
                  <ArrowRight size={16} />
                </Link>
              </>
            )}

            {/* Signed In State */}
            {isLoaded && isSignedIn && (
              <>
                {/* Pro Status Indicator */}
                <ProStatusIndicator />

                <Link
                  to="/chat"
                  className="hidden md:flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Workspace
                  <Sparkles size={16} />
                </Link>

                {/* Custom User Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-white flex items-center justify-center text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:opacity-90 transition-opacity"
                  >
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="User" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getUserInitials()
                    )}
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 z-50">
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                        <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                          {user?.emailAddresses?.[0]?.emailAddress}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 -mr-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav >

      {/* Mobile Menu Overlay */}
      {
        mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-white md:hidden animate-in slide-in-from-top-10 duration-200">
            <div className="flex flex-col h-full pt-20 px-6 pb-6">
              <div className="flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className="text-2xl font-semibold text-zinc-900 py-4 border-b border-zinc-100 flex items-center justify-between group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                    <ArrowRight size={20} className="text-zinc-300 group-hover:text-zinc-900 -translate-x-4 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-4">
                {isLoaded && !isSignedIn && (
                  <>
                    <Link
                      to="/sign-in"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/sign-up"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start Building
                      <ArrowRight size={18} />
                    </Link>
                  </>
                )}

                {isLoaded && isSignedIn && (
                  <Link
                    to="/chat"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to Workspace
                    <Sparkles size={18} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Navbar;