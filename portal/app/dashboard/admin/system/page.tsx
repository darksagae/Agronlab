'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { client } from '../../../../lib/queries';
import Link from 'next/link';

const ADMIN_EMAIL = 'admin@agron.uk';

type DiagRecord = {
  id: string;
  userSub: string;
  cropType: string;
  healthStatus: string;
  diseaseType: string;
  severityLevel: string | null;
  confidenceScore: number;
  aiSource: string;
  country: string | null;
  scannedAt: string;
  trainingStatus: string | null;
  userFeedback: string | null;
  imageS3Key: string;
};

type AgentRun = {
  id: string;
  userSub: string | null;
  skill: string;
  success: boolean;
  latencyMs: number | null;
  createdAt: string | null;
};

export default function SystemAdminPage() {
  const [tab, setTab] = useState<'overview' | 'scans' | 'agents' | 'users'>('overview');

  const { data: attrs } = useQuery({ queryKey: ['userAttributes'], queryFn: fetchUserAttributes });
  const isSuperAdmin = attrs?.email === ADMIN_EMAIL;

  const { data: scans = [], isLoading: scansLoading } = useQuery({
    queryKey: ['adminScans'],
    queryFn: async () => {
      const { data } = await client.models.DiagnosisRecord.list();
      return (data ?? []) as DiagRecord[];
    },
    enabled: isSuperAdmin,
  });

  const { data: agentRuns = [], isLoading: agentLoading } = useQuery({
    queryKey: ['adminAgentRuns'],
    queryFn: async () => {
      const { data } = await client.models.AgentSkillRun.list();
      return (data ?? []) as AgentRun[];
    },
    enabled: isSuperAdmin,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: async () => {
      const { data } = await client.models.MerchantProfile.list();
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['adminListings'],
    queryFn: async () => {
      const { data } = await client.models.MarketListing.list();
      return data ?? [];
    },
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-4xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500 text-sm">This area is restricted to system administrators.</p>
      </div>
    );
  }

  const totalScans = scans.length;
  const diseaseScans = scans.filter(s => s.healthStatus !== 'healthy').length;
  const premiumScans = scans.filter(s => s.aiSource === 'gemini_premium').length;
  const agentSuccessRate = agentRuns.length
    ? Math.round((agentRuns.filter(r => r.success).length / agentRuns.length) * 100)
    : 0;

  const scansByCrop = scans.reduce((acc: Record<string, number>, s) => {
    acc[s.cropType] = (acc[s.cropType] ?? 0) + 1;
    return acc;
  }, {});

  const skillCounts = agentRuns.reduce((acc: Record<string, number>, r) => {
    acc[r.skill] = (acc[r.skill] ?? 0) + 1;
    return acc;
  }, {});

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'scans', label: `Crop Scans (${totalScans})` },
    { id: 'agents', label: `Agent Runs (${agentRuns.length})` },
    { id: 'users', label: `Users (${profiles.length})` },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-agron-dark">System Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Full system visibility for admin@agron.uk</p>
        </div>
        <Link
          href="/dashboard/admin/sellers"
          className="text-sm text-agron-green underline"
        >
          Seller Approvals →
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-agron-green text-agron-dark'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Crop Scans', value: totalScans, color: 'bg-green-50 border-green-200' },
              { label: 'Disease Detections', value: diseaseScans, color: 'bg-red-50 border-red-200' },
              { label: 'Premium Scans', value: premiumScans, color: 'bg-blue-50 border-blue-200' },
              { label: 'Registered Users', value: profiles.length, color: 'bg-purple-50 border-purple-200' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                <p className="text-2xl font-black text-agron-dark">{stat.value}</p>
                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Scans by Crop Type</h3>
              {Object.entries(scansByCrop).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([crop, count]) => (
                <div key={crop} className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-600 w-28 capitalize">{crop}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-agron-green rounded-full"
                      style={{ width: `${(count / totalScans) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </div>
              ))}
              {totalScans === 0 && <p className="text-sm text-gray-400">No scans yet</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-700 mb-4">Agent Skill Usage</h3>
              <p className="text-sm text-gray-500 mb-3">Success rate: <span className="font-bold text-agron-green">{agentSuccessRate}%</span></p>
              {Object.entries(skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([skill, count]) => (
                <div key={skill} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                  <span className="text-gray-700 font-mono text-xs">{skill}</span>
                  <span className="text-agron-green font-semibold">{count}</span>
                </div>
              ))}
              {agentRuns.length === 0 && <p className="text-sm text-gray-400">No agent runs yet</p>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Market Activity</h3>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-gray-500">Total Listings:</span>
                <span className="font-semibold text-agron-dark ml-2">{listings.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Active:</span>
                <span className="font-semibold text-green-600 ml-2">
                  {listings.filter(l => l.status === 'ACTIVE').length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Sold:</span>
                <span className="font-semibold text-blue-600 ml-2">
                  {listings.filter(l => l.status === 'SOLD').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Scans */}
      {tab === 'scans' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {scansLoading ? (
            <div className="p-8 text-center text-gray-400">Loading scans...</div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No crop scans recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Crop</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Disease</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Severity</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">AI Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Country</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Scanned</th>
                  </tr>
                </thead>
                <tbody>
                  {scans.slice().reverse().slice(0, 100).map(scan => (
                    <tr key={scan.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium capitalize">{scan.cropType}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{scan.diseaseType}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          scan.severityLevel === 'critical' ? 'bg-red-100 text-red-700' :
                          scan.severityLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                          scan.severityLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>{scan.severityLevel ?? 'low'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{scan.aiSource}</td>
                      <td className="px-4 py-3 text-gray-600">{scan.country ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          scan.trainingStatus === 'TRAINING_READY' ? 'bg-blue-100 text-blue-700' :
                          scan.trainingStatus === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{scan.trainingStatus ?? 'PENDING'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(scan.scannedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Agent Runs */}
      {tab === 'agents' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {agentLoading ? (
            <div className="p-8 text-center text-gray-400">Loading agent runs...</div>
          ) : agentRuns.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No agent skill runs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Skill</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Latency</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRuns.slice().reverse().slice(0, 100).map(run => (
                    <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-agron-dark">{run.skill}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          run.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{run.success ? 'OK' : 'FAIL'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {run.latencyMs ? `${run.latencyMs}ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono truncate max-w-[120px]">
                        {run.userSub?.slice(0, 8) ?? 'anon'}…
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {run.createdAt ? new Date(run.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {profiles.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No user profiles yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Display Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Business</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Country</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(profile => (
                    <tr key={profile.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{profile.displayName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{profile.businessName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          profile.role === 'BOTH' ? 'bg-blue-100 text-blue-700' :
                          profile.role === 'SELLER' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{profile.role ?? 'BUYER'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{profile.country ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          profile.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          profile.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          profile.approvalStatus === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{profile.approvalStatus ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
