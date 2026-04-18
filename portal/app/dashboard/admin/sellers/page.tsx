'use client';

import { useEffect, useState } from 'react';
import { client } from '../../../../lib/queries';

type SellerRequest = {
  id: string;
  userSub: string;
  displayName: string | null;
  businessName: string | null;
  approvalStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | null;
  approvalNote: string | null;
  sellerRequestJson: string | null;
};

type ParsedRequest = {
  businessName?: string;
  businessLicense?: string;
  taxId?: string;
  businessDescription?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessAddress?: { city?: string; district?: string; country?: string };
  submittedAt?: string;
};

export default function AdminSellersPage() {
  const [profiles, setProfiles] = useState<SellerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING_REVIEW');
  const [actionNote, setActionNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.MerchantProfile.list();
      const sellers = (data ?? []).filter(
        (p) => p.sellerRequestJson || p.approvalStatus
      ) as SellerRequest[];
      setProfiles(sellers);
    } catch (err) {
      console.error('[AdminSellers] load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (profile: SellerRequest) => {
    setProcessing(profile.id);
    try {
      await client.models.MerchantProfile.update({
        id: profile.id,
        approvalStatus: 'APPROVED',
        role: 'SELLER',
        approvalNote: actionNote[profile.id] || 'Approved by admin',
      });
      await load();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
    setProcessing(null);
  };

  const reject = async (profile: SellerRequest) => {
    if (!actionNote[profile.id]?.trim()) {
      alert('Please enter a rejection reason before rejecting.');
      return;
    }
    setProcessing(profile.id);
    try {
      await client.models.MerchantProfile.update({
        id: profile.id,
        approvalStatus: 'REJECTED',
        approvalNote: actionNote[profile.id],
      });
      await load();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
    setProcessing(null);
  };

  const filtered = filter === 'ALL'
    ? profiles
    : profiles.filter((p) => p.approvalStatus === filter || (!p.approvalStatus && filter === 'PENDING_REVIEW'));

  const counts = {
    PENDING_REVIEW: profiles.filter((p) => p.approvalStatus === 'PENDING_REVIEW' || !p.approvalStatus).length,
    APPROVED: profiles.filter((p) => p.approvalStatus === 'APPROVED').length,
    REJECTED: profiles.filter((p) => p.approvalStatus === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-agron-dark">Seller Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve/reject seller registration requests</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 text-sm bg-agron-green text-white rounded-lg hover:opacity-90"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stat tabs */}
      <div className="flex gap-3 flex-wrap">
        {(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? 'bg-agron-dark text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'PENDING_REVIEW' ? `⏳ Pending (${counts.PENDING_REVIEW})` :
             f === 'APPROVED' ? `✅ Approved (${counts.APPROVED})` :
             f === 'REJECTED' ? `❌ Rejected (${counts.REJECTED})` :
             `All (${profiles.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
          No {filter === 'ALL' ? '' : filter.toLowerCase().replace('_', ' ')} requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((profile) => {
            const req: ParsedRequest = (() => {
              try { return profile.sellerRequestJson ? JSON.parse(profile.sellerRequestJson) : {}; }
              catch { return {}; }
            })();
            const status = profile.approvalStatus ?? 'PENDING_REVIEW';
            const isProcessing = processing === profile.id;

            return (
              <div key={profile.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-agron-dark text-lg">
                        {req.businessName || profile.businessName || profile.displayName || 'Unknown'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">sub: {profile.userSub}</div>
                  </div>
                  {req.submittedAt && (
                    <div className="text-xs text-gray-400">
                      {new Date(req.submittedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Request details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {req.contactPhone && (
                    <div><span className="text-gray-400">Phone:</span> {req.contactPhone}</div>
                  )}
                  {req.contactEmail && (
                    <div><span className="text-gray-400">Email:</span> {req.contactEmail}</div>
                  )}
                  {req.businessLicense && (
                    <div><span className="text-gray-400">License:</span> {req.businessLicense}</div>
                  )}
                  {req.taxId && (
                    <div><span className="text-gray-400">TIN:</span> {req.taxId}</div>
                  )}
                  {req.businessAddress?.city && (
                    <div>
                      <span className="text-gray-400">Location:</span>{' '}
                      {[req.businessAddress.city, req.businessAddress.district, req.businessAddress.country]
                        .filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>

                {req.businessDescription && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    {req.businessDescription}
                  </div>
                )}

                {/* Existing approval note */}
                {profile.approvalNote && (
                  <div className="text-sm text-gray-500 italic bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                    Note: {profile.approvalNote}
                  </div>
                )}

                {/* Action area (only for pending) */}
                {status === 'PENDING_REVIEW' && (
                  <div className="flex gap-3 items-center pt-2 border-t border-gray-100">
                    <input
                      type="text"
                      placeholder="Optional note (required for rejection)"
                      value={actionNote[profile.id] ?? ''}
                      onChange={(e) => setActionNote((prev) => ({ ...prev, [profile.id]: e.target.value }))}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-agron-green"
                    />
                    <button
                      onClick={() => approve(profile)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-agron-green text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {isProcessing ? '…' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => reject(profile)}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      {isProcessing ? '…' : '✗ Reject'}
                    </button>
                  </div>
                )}

                {/* Re-review approved/rejected */}
                {status !== 'PENDING_REVIEW' && (
                  <div className="flex gap-3 items-center pt-2 border-t border-gray-100">
                    <button
                      onClick={async () => {
                        setProcessing(profile.id);
                        await client.models.MerchantProfile.update({
                          id: profile.id,
                          approvalStatus: 'PENDING_REVIEW',
                          approvalNote: 'Reset to pending by admin',
                        });
                        await load();
                        setProcessing(null);
                      }}
                      className="text-xs text-gray-400 underline hover:text-gray-600"
                    >
                      Reset to pending
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
