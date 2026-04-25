'use client';

import { useState, useEffect } from 'react';
import { signIn, getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-agron-green shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === '1') setVerified(true);

    // Redirect to dashboard if already signed in
    getCurrentUser()
      .then(() => router.replace('/dashboard'))
      .catch(() => setCheckingSession(false));
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn({ username: email, password });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 bg-agron-green rounded-full animate-pulse flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen">
      {/* ── Left panel ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-2/5 bg-agron-dark flex-col justify-between p-12 relative overflow-hidden">
        {/* Background dot grid */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%234CAF50'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-agron-green/10 blur-3xl pointer-events-none" />

        {/* Top: logo */}
        <div className="relative flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="AGRON" className="w-9 h-9 rounded-xl shadow-lg" />
          <div>
            <span className="text-white font-bold text-sm block">AGRON Portal</span>
            <span className="text-green-300/60 text-xs">Agricultural Platform</span>
          </div>
        </div>

        {/* Middle: headline + bullets */}
        <div className="relative">
          <h2 className="text-3xl font-bold text-white leading-tight mb-8">
            Welcome<br />back.
          </h2>
          <ul className="space-y-4">
            {[
              'Post and manage market listings instantly',
              'Reach buyers across Africa with one account',
              'End-to-end encrypted buyer conversations',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckIcon />
                <span className="text-green-100/70 text-sm leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: quote */}
        <div className="relative border-t border-white/10 pt-6">
          <p className="text-green-200/60 text-xs leading-relaxed italic">
            &ldquo;AGRON helps me reach buyers across Uganda without going through middlemen. My revenue doubled in three months.&rdquo;
          </p>
          <p className="text-green-300/50 text-xs mt-2">— Joseph Okello, Farmer, Lira</p>
        </div>
      </div>

      {/* ── Right panel: form ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="AGRON" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-agron-dark">AGRON Portal</span>
          </div>

          <h1 className="text-2xl font-bold text-agron-dark mb-1">Sign in to your account</h1>
          <p className="text-sm text-gray-500 mb-8">
            No account?{' '}
            <Link href="/signup" className="text-agron-green font-semibold hover:underline">
              Create one free
            </Link>
          </p>

          {verified && (
            <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <CheckIcon />
              Email verified — you can now sign in.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Floating label: email */}
            <div className="float-group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=" "
                className="float-input"
              />
              <label htmlFor="email" className="float-label">Email address</label>
            </div>

            {/* Floating label: password */}
            <div className="float-group">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
                className="float-input"
              />
              <label htmlFor="password" className="float-label">Password</label>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || success}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm
                ${success
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-agron-green text-white hover:bg-green-600 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0'
                }`}
            >
              {success ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Welcome back — redirecting…
                </span>
              ) : loading ? (
                <><span className="btn-spinner" />Signing in…</>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
