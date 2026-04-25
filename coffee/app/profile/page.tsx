'use client';

import { useEffect, useState, useRef } from 'react';
import { getCurrentUser, signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { LOCALE_LABELS, Locale } from '../../lib/i18n';

function getLocale(): Locale {
  if (typeof localStorage === 'undefined') return 'en';
  return (localStorage.getItem('coffee_locale') as Locale) || 'en';
}

const PROFILE_TR: Record<Locale, Record<string, string>> = {} as Record<Locale, Record<string, string>>;
const EN: Record<string, string> = {
  title: 'Your Account',
  email: 'Email',
  name: 'Name',
  sign_out: 'Sign Out',
  shop: 'Browse Coffee →',
  language: 'Language',
  account_works: 'This account also works on',
};

export default function ProfilePage() {
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const storeLogoInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ email?: string; name?: string; sub?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [uploading, setUploading] = useState<'avatar' | 'logo' | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setLocale(getLocale());
    getCurrentUser()
      .then(() => fetchUserAttributes())
      .then(attrs => setUser({ email: attrs.email, name: attrs.name, sub: attrs.sub }))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const uploadImage = async (file: File, type: 'avatar' | 'logo') => {
    setUploading(type);
    setUploadError('');
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString() ?? '';
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('https://portal.agron.uk/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      if (type === 'avatar') setAvatarUrl(data.url);
      else setStoreLogoUrl(data.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const changeLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem('coffee_locale', l);
  };

  const tr = (k: string) => EN[k] ?? k;

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--gold)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  const initial = (user?.name || user?.email || '?')[0].toUpperCase();

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ width: '100%', maxWidth: 440, border: '1px solid var(--bdr-s)', background: 'var(--surf)', padding: '48px 40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 40, right: 40, height: '1px', background: 'linear-gradient(to right, var(--gold), transparent)' }} />

        <a href="/" style={{ fontFamily: 'var(--dp)', fontSize: 18, letterSpacing: 6, textTransform: 'uppercase', color: 'var(--gl)', display: 'block', marginBottom: 32, textDecoration: 'none' }}>Agron Coffee</a>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid var(--bdr)' }}>
          <button
            onClick={() => avatarInputRef.current?.click()}
            style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', background: 'var(--gold)', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Change profile photo"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'var(--dp)', fontSize: 22, color: '#000' }}>{initial}</span>
            )}
            {uploading === 'avatar' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'avatar')} />
          <div>
            {user?.name && <div style={{ fontFamily: 'var(--dp)', fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{user.name}</div>}
            <div style={{ fontFamily: 'var(--mn)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{user?.email}</div>
            <div style={{ fontFamily: 'var(--mn)', fontSize: 9, color: 'var(--gold)', letterSpacing: 1, cursor: 'pointer', marginTop: 4 }}
              onClick={() => avatarInputRef.current?.click()}>Change photo</div>
          </div>
        </div>

        {/* Store Logo Upload */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--bdr)' }}>
          <div style={{ fontFamily: 'var(--mn)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Store Logo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => storeLogoInputRef.current?.click()}
              style={{ position: 'relative', width: 56, height: 56, borderRadius: 8, overflow: 'hidden', background: 'var(--bg)', border: '1px dashed var(--gold)', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {storeLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--gold)', fontSize: 22 }}>+</span>
              )}
              {uploading === 'logo' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 14, height: 14, border: '2px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
              )}
            </button>
            <input ref={storeLogoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
            <div>
              <div style={{ fontFamily: 'var(--mn)', fontSize: 10, color: 'var(--text)', marginBottom: 4 }}>Your store icon</div>
              <div style={{ fontFamily: 'var(--mn)', fontSize: 9, color: 'var(--muted)' }}>Shown on Agron Coffee store page</div>
            </div>
          </div>
          {uploadError && <div style={{ fontFamily: 'var(--mn)', fontSize: 9, color: '#e57373', marginTop: 8 }}>{uploadError}</div>}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
          <Row label={tr('email')} value={user?.email ?? '—'} />
          {user?.name && <Row label={tr('name')} value={user.name} />}

          {/* Language selector */}
          <div>
            <div style={{ fontFamily: 'var(--mn)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{tr('language')}</div>
            <select
              value={locale}
              onChange={e => changeLocale(e.target.value as Locale)}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--bdr)', color: 'var(--text)', fontFamily: 'var(--mn)', fontSize: 11, letterSpacing: 1, padding: '10px 12px', cursor: 'pointer' }}
            >
              {(Object.entries(LOCALE_LABELS) as [Locale, string][]).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#100d08' }}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="/shop" style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--bd)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', padding: '14px', background: 'var(--gold)', color: '#000', textDecoration: 'none' }}>
            {tr('shop')}
          </a>
          <button
            onClick={handleSignOut}
            style={{ fontFamily: 'var(--mn)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '12px', background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--muted)', cursor: 'pointer' }}
          >
            {tr('sign_out')}
          </button>
        </div>

        <p style={{ marginTop: 24, fontFamily: 'var(--mn)', fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textAlign: 'center' }}>
          {tr('account_works')}{' '}
          <a href="https://agron.uk" style={{ color: 'var(--gold)', textDecoration: 'none' }}>agron.uk</a>
          {' '}&amp;{' '}
          <a href="https://portal.agron.uk" style={{ color: 'var(--gold)', textDecoration: 'none' }}>portal.agron.uk</a>
        </p>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--mn)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--bd)', fontSize: 14, color: 'var(--text)', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--bdr)' }}>{value}</div>
    </div>
  );
}
