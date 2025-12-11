import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
        ? 'bg-aura-black/80 backdrop-blur-md border-aura-border py-4'
        : 'bg-transparent border-transparent py-6'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 group cursor-pointer">
          {/* Elegant Text Logo */}
          <Link to="/" className="font-display font-bold text-2xl tracking-[0.2em] text-white hover:text-white/80 transition-colors">
            NEVRA
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Agents', 'Workflows', 'Enterprise', 'Pricing'].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="text-sm font-medium text-aura-secondary hover:text-white transition-colors tracking-wide"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* CTA & Auth */}
        <div className="hidden md:flex items-center gap-4">
          {/* Signed Out - Show Sign In Button */}
          <SignedOut>
            <Link
              to="/sign-in"
              className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </SignedOut>

          {/* Signed In - Show Deploy Agent & User Button */}
          <SignedIn>
            <Link
              to="/chat"
              className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-full text-xs font-medium uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center gap-2 group"
            >
              Deploy Agent
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>

            {/* Clerk User Button with custom styling */}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-9 h-9 border-2 border-white/20 hover:border-purple-500/50 transition-colors',
                  userButtonPopoverCard: 'bg-[#0a0a0a] border border-white/10',
                  userButtonPopoverActionButton: 'text-white hover:bg-white/5',
                  userButtonPopoverActionButtonText: 'text-gray-300',
                  userButtonPopoverActionButtonIcon: 'text-gray-400',
                  userButtonPopoverFooter: 'hidden',
                }
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-aura-black border-b border-aura-border p-6 flex flex-col gap-4 md:hidden">
          {['Agents', 'Workflows', 'Enterprise', 'Pricing'].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="text-lg font-medium text-aura-secondary hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="h-px bg-aura-border my-2" />

          {/* Mobile Auth */}
          <SignedOut>
            <Link
              to="/sign-in"
              className="w-full bg-white text-black px-4 py-3 rounded-lg text-sm font-semibold text-center block"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              to="/chat"
              className="w-full bg-white text-black px-4 py-3 rounded-lg text-sm font-semibold text-center block"
              onClick={() => setMobileMenuOpen(false)}
            >
              Deploy Agent
            </Link>
          </SignedIn>
        </div>
      )}
    </nav>
  );
};

export default Navbar;