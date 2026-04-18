'use client';

import { useState } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Step = 'register' | 'verify';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | 'BOTH'>('BOTH');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp({
        username: email,
        password,
        options: { userAttributes: { email, name: displayName } },
      });
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
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
    <main className="min-h-screen bg-agron-light flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-agron-green rounded-full flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-agron-dark">
            {step === 'register' ? 'Join AGRON Portal' : 'Verify Your Email'}
          </h1>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-agron-green"
                placeholder="Your name or business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-agron-green"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-agron-green"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
              <div className="flex gap-2">
                {(['BUYER', 'SELLER', 'BOTH'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      role === r
                        ? 'border-agron-green bg-agron-light text-agron-dark'
                        : 'border-gray-200 text-gray-500 hover:border-agron-green'
                    }`}
                  >
                    {r === 'BOTH' ? 'Buyer & Seller' : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-gray-600 text-sm">
              A verification code was sent to <strong>{email}</strong>. Enter it below.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                inputMode="numeric"
                maxLength={6}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-agron-green text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-agron-green text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
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
