'use client';

import { useState, useEffect } from 'react';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRY_LIST } from '@/lib/countryConfig';

type Step = 'register' | 'verify';
type Role = 'SELLER' | 'SHOP_OWNER';

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  {
    value: 'SELLER',
    label: 'Seller / Trader',
    icon: '🌾',
    desc: 'I sell or buy agricultural products directly. I want to post listings and connect with buyers.',
  },
  {
    value: 'SHOP_OWNER',
    label: 'Shop Owner',
    icon: '🏪',
    desc: 'I own a registered store or agro-dealership and want to manage my product catalog.',
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [role, setRole] = useState<Role>('SELLER');
  const [country, setCountry] = useState('UG');
  const [countrySearch, setCountrySearch] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [detectingLocation, setDetectingLocation] = useState(true);

  // Auto-detect country from IP on load
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const code = data.country_code as string;
          const found = COUNTRY_LIST.find(c => c.code === code);
          if (found) setCountry(found.code);
        }
      } catch {
        // Silently fall back to UG
      } finally {
        setDetectingLocation(false);
      }
    };
    detect();
  }, []);

  const filteredCountries = countrySearch.trim()
    ? COUNTRY_LIST.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRY_LIST;

  const selectedCountry = COUNTRY_LIST.find(c => c.code === country);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pwd)) return 'Password must include at least one uppercase letter (A-Z).';
    if (!/[a-z]/.test(pwd)) return 'Password must include at least one lowercase letter (a-z).';
    if (!/[0-9]/.test(pwd)) return 'Password must include at least one number (0-9).';
    if (!/[!@#$%^&*()_\-+={}[\]|\\;:'",.<>?/~`]/.test(pwd)) return 'Password must include at least one special character (e.g. !@#$%).';
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name: displayName } },
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingRole', role);
        localStorage.setItem('pendingCountry', country);
        localStorage.setItem('pendingBusinessName', businessName);
      }
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await resendSignUpCode({ username: email });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(interval); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
      router.push('/login?verified=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-agron-light flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-agron-green rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-agron-dark">
              {step === 'register' ? 'Join AGRON Portal' : 'Verify Your Email'}
            </h1>
            <p className="text-xs text-gray-400">Agricultural platform — global</p>
          </div>
        </div>

        <div className="border-t border-gray-100 my-4" />

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Role selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">I am a…</label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      role === r.value
                        ? 'border-agron-green bg-agron-light shadow-sm'
                        : 'border-gray-200 hover:border-agron-green/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div className="font-semibold text-sm text-agron-dark">{r.label}</div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Full Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-agron-green text-sm"
                placeholder="John Kato"
              />
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'SHOP_OWNER' ? 'Store / Business Name' : 'Trading Name (optional)'}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required={role === 'SHOP_OWNER'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-agron-green text-sm"
                placeholder={role === 'SHOP_OWNER' ? 'Kato Agro Supplies Ltd' : 'Optional trading name'}
              />
            </div>

            {/* Country — searchable with flag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
                {detectingLocation && <span className="ml-2 text-xs text-gray-400">Detecting…</span>}
              </label>
              <div className="relative">
                <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 mb-1 bg-gray-50">
                  <span className="text-lg">{selectedCountry?.flag}</span>
                  <input
                    type="text"
                    placeholder={`${selectedCountry?.name || 'Search country…'}`}
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onFocus={() => setCountrySearch('')}
                    className="flex-1 text-sm bg-transparent outline-none"
                  />
                </div>
                {countrySearch && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => { setCountry(c.code); setCountrySearch(''); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 ${
                          country === c.code ? 'bg-agron-light font-medium' : ''
                        }`}
                      >
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{c.currency.code}</span>
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">No country found</p>
                    )}
                  </div>
                )}
              </div>
              {selectedCountry && !countrySearch && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedCountry.flag} {selectedCountry.name} · {selectedCountry.currency.code} · AI will use local crop & disease data
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-agron-green text-sm"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-agron-green text-sm"
                placeholder="Min 8 characters"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-agron-green text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-60 text-sm"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              By creating an account you agree to AGRON&apos;s terms of service.
              Subscription required to post listings and access AI features.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-gray-600 text-sm">
                A verification code was sent to <strong>{email}</strong>. Check your inbox (and spam folder) and enter it below.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="mt-3 text-sm text-agron-green hover:underline disabled:text-gray-400 disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive it? Resend code"}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode="numeric"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-agron-green text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-agron-green text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify & Continue →'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-agron-green font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
