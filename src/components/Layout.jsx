import { NavLink, Outlet, Link } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { Menu, X } from 'lucide-react';
import AuthButton from './AuthButton';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import ErrorBoundary from './ErrorBoundary';

const GridBackground = lazy(() => import('./GridBackground'));

function AshokaMotif({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={`w-32 h-32 md:w-48 md:h-48 opacity-[0.025] ${className}`}>
      {/* Outer dharma circle */}
      <circle cx="60" cy="60" r="55" stroke="#6366F1" strokeWidth="0.8" fill="none" />
      <circle cx="60" cy="60" r="48" stroke="#6366F1" strokeWidth="0.5" fill="none" />
      {/* 24 spokes — Ashoka Chakra */}
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="60" y1="60"
          x2={60 + 48 * Math.cos((i * Math.PI) / 12)}
          y2={60 + 48 * Math.sin((i * Math.PI) / 12)}
          stroke="#6366F1"
          strokeWidth="0.6"
        />
      ))}
      {/* Inner hub */}
      <circle cx="60" cy="60" r="12" fill="#6366F1" fillOpacity="0.15" />
      <circle cx="60" cy="60" r="12" stroke="#6366F1" strokeWidth="0.8" fill="none" />
      {/* Petal accents at cardinal points */}
      {[0, 6, 12, 18].map((i) => (
        <circle
          key={i}
          cx={60 + 32 * Math.cos((i * Math.PI) / 12)}
          cy={60 + 32 * Math.sin((i * Math.PI) / 12)}
          r="3"
          fill={i % 12 === 0 ? '#FF9933' : '#128807'}
          fillOpacity="0.4"
        />
      ))}
    </svg>
  );
}

function TricolorStripe() {
  return (
    <div className="h-[2px] flex">
      <div className="flex-1 bg-[#FF9933] opacity-40" />
      <div className="flex-1 bg-ink-faint opacity-40" />
      <div className="flex-1 bg-[#128807] opacity-40" />
    </div>
  );
}

export default function Layout() {
  const [mobileNav, setMobileNav] = useState(false);

  const link = ({ isActive }) =>
    `text-[13px] tracking-wide transition-colors px-3 py-1.5 ${
      isActive ? 'text-ink font-medium' : 'text-ink-tertiary hover:text-ink-secondary'
    }`;

  const mobileLink = ({ isActive }) =>
    `block text-[15px] tracking-wide transition-colors px-4 py-3 border-b border-rule-light ${
      isActive ? 'text-ink font-medium bg-surface-raised' : 'text-ink-tertiary hover:text-ink-secondary'
    }`;

  return (
    <div className="min-h-screen bg-void relative overflow-hidden">
      <ErrorBoundary>
        <Suspense fallback={null}>
          <GridBackground />
        </Suspense>
      </ErrorBoundary>

      {/* Ashoka Chakra Ornaments */}
      <AshokaMotif className="fixed -top-8 -left-8 md:-top-12 md:-left-12" />
      <AshokaMotif className="fixed -top-8 -right-8 md:-top-12 md:-right-12" />
      <AshokaMotif className="fixed -bottom-8 -left-8 md:-bottom-12 md:-left-12" />
      <AshokaMotif className="fixed -bottom-8 -right-8 md:-bottom-12 md:-right-12" />

      <header className="sticky top-0 z-50 bg-void/80 backdrop-blur-2xl border-b border-rule">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="font-serif text-[17px] text-ink tracking-tight">Attestr</span>
            <span className="text-[10px] text-kesari font-medium tracking-wide hidden sm:inline">प्रमाण</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/register" className={link}>Register</NavLink>
            <NavLink to="/verify" className={link}>Verify</NavLink>
            <NavLink to="/explorer" className={link}>My Media</NavLink>
            <NavLink to="/activity" className={link}>Activity</NavLink>
            <NavLink to="/docs" className={link}>API</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden md:block">
              <AuthButton />
            </div>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden p-1.5 text-ink-tertiary hover:text-ink transition"
              aria-label="Toggle menu"
            >
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {/* Mobile nav dropdown */}
        {mobileNav && (
          <nav className="md:hidden border-t border-rule bg-void/95 backdrop-blur-2xl">
            <NavLink to="/register" className={mobileLink} onClick={() => setMobileNav(false)}>Register</NavLink>
            <NavLink to="/verify" className={mobileLink} onClick={() => setMobileNav(false)}>Verify</NavLink>
            <NavLink to="/explorer" className={mobileLink} onClick={() => setMobileNav(false)}>My Media</NavLink>
            <NavLink to="/activity" className={mobileLink} onClick={() => setMobileNav(false)}>Activity</NavLink>
            <div className="px-4 py-3">
              <AuthButton />
            </div>
          </nav>
        )}
      </header>
      <TricolorStripe />
      <main className="relative z-10 max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
