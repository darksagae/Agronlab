'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, fetchUserAttributes, updateUserAttributes } from 'aws-amplify/auth';
import { getMyProfile, upsertProfile, client } from '../../../lib/queries';
import { getAdminHeaders } from '../../../lib/useAdminFetch';
import Image from 'next/image';

const COUNTRIES = [
  { code: 'UG', name: 'Uganda' },
  { code: 'KE', name: 'Kenya' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'OTHER', name: 'Other' },
];

export default function ProfilePage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: '',
    businessName: '',
    role: 'BUYER' as 'BUYER' | 'SELLER' | 'BOTH',
    country: 'UG',
    avatarUrl: '',
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: getCurrentUser });
  const { data: attrs } = useQuery({ queryKey: ['userAttributes'], queryFn: fetchUserAttributes });
  const { data: profile } = useQuery({ queryKey: ['myProfile'], queryFn: getMyProfile });

  const { data: subscription } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      if (!user?.userId) return null;
      const { data } = await client.models.UserSubscription.list({
        filter: { userSub: { eq: user.userId }, status: { eq: 'ACTIVE' } },
      });
      return data[0] ?? null;
    },
    enabled: !!user?.userId,
  });

  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        displayName: profile.displayName ?? '',
        businessName: profile.businessName ?? '',
        role: (profile.role as 'BUYER' | 'SELLER' | 'BOTH') ?? 'BUYER',
        country: profile.country ?? 'UG',
      }));
    }
  }, [profile]);

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    try {
      const headers = await getAdminHeaders();
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { Authorization: headers.Authorization },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, avatarUrl: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await upsertProfile({
        displayName: form.displayName,
        businessName: form.businessName || undefined,
        role: form.role,
        country: form.country,
      });
      qc.invalidateQueries({ queryKey: ['myProfile'] });
      setSuccess('Profile saved successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const applyPromo = async () => {
    if (promoCode.toLowerCase().trim() === 'sti') {
      if (!user?.userId) return;
      try {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        await client.models.UserSubscription.create({
          userSub: user.userId,
          planId: 'promo_sti',
          status: 'ACTIVE',
          expiresAt: expiresAt.toISOString(),
          amountPaid: 0,
          currency: 'USD',
        });
        qc.invalidateQueries({ queryKey: ['mySubscription'] });
        setPromoMsg('✓ Promo code applied! Premium access activated for 1 year.');
        setPromoCode('');
      } catch (e) {
        setPromoMsg(e instanceof Error ? e.message : 'Failed to apply promo');
      }
    } else {
      setPromoMsg('Invalid promo code.');
    }
  };

  const isPremium = !!subscription;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-agron-dark">My Profile</h1>

      {/* Avatar & Basic Info */}
      <form onSubmit={save} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-gray-700">Account Details</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-agron-green/40 hover:border-agron-green transition-colors"
          >
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-agron-light flex items-center justify-center text-2xl font-bold text-agron-green">
                {form.displayName?.slice(0, 1).toUpperCase() || '?'}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-agron-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">{attrs?.email ?? user?.signInDetails?.loginId}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-agron-green hover:underline mt-1"
            >
              Change photo
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </div>
          {isPremium && (
            <span className="ml-auto text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full font-semibold">
              Premium
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              className="input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              className="input"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as typeof form.role }))}
              className="input"
            >
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller / Farmer</option>
              <option value="BOTH">Both (Shop Owner)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="input"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-agron-green text-white py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {/* Premium subscription */}
      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-700">Premium Access</h2>
        {isPremium ? (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <p className="font-semibold text-yellow-800">You have Premium access</p>
            <p className="text-sm text-yellow-700 mt-1">
              Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
            </p>
            <p className="text-xs text-yellow-600 mt-1">Plan: {subscription.planId}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Upgrade to Premium for full AI crop analysis, unlimited diagnoses, and priority support.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="input flex-1"
              />
              <button
                onClick={applyPromo}
                className="bg-agron-green text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
              >
                Apply
              </button>
            </div>
            {promoMsg && (
              <p className={`text-sm ${promoMsg.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
                {promoMsg}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Account Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{attrs?.email ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">User ID</span>
            <span className="font-mono text-xs text-gray-400">{user?.userId?.slice(0, 12)}…</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">E2E Encryption</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
