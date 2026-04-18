import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-agron-light flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-agron-green rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-4xl font-bold text-agron-dark">AGRON Portal</h1>
        </div>
        <p className="text-lg text-gray-600 mb-8">
          The merchant hub for agricultural traders. Manage your store, list products,
          browse the marketplace, and message buyers and sellers — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-agron-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="border-2 border-agron-green text-agron-green px-8 py-3 rounded-lg font-semibold hover:bg-agron-light transition-colors"
          >
            Create Account
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          Have the AGRON app?{' '}
          <a
            href="https://expo.dev/@agron/app"
            className="text-agron-green underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download it here
          </a>
        </p>
      </div>
    </main>
  );
}
