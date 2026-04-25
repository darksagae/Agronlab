'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, RefreshCw, Wallet, Plus, Trash2, Loader2,
  Leaf, Sparkles, ChevronRight, RotateCw, TrendingUp, X,
} from 'lucide-react';
import { planCrop } from '@/lib/api';

const CROPS = ['Maize','Cassava','Beans','Tomato','Banana','Coffee','Rice','Sorghum','Groundnut','Sweet Potato','Soybean','Wheat'];
const PLAN_KEY = 'agron_crop_plans';

interface CropPlan {
  id: string;
  crop: string;
  area: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface RotationCrop {
  crop: string;
  duration: string;
  budget: string;
  agronomicReason: string;
  marketOutlook?: string;
}

interface BudgetItem {
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  agronProduct?: string;
}

type SubTab = 'calendar' | 'rotation' | 'budget';

function AddPlanModal({ onClose, onSave }: { onClose: () => void; onSave: (p: CropPlan) => void }) {
  const [form, setForm] = useState({ crop: '', area: '', startDate: '', endDate: '', notes: '' });
  const f = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.crop || !form.startDate) return;
    onSave({ ...form, id: Date.now().toString() });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: 'rgba(2,10,4,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="glass-strong rounded-3xl p-7 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black" style={{ color: '#DCF5E2' }}>New Crop Plan</h2>
          <button onClick={onClose}><X size={18} style={{ color: '#3D6645' }} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs mb-2 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Crop</p>
            <div className="flex flex-wrap gap-2">
              {CROPS.map(c => (
                <button key={c} onClick={() => f('crop', c)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={form.crop === c
                    ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.35)', color: '#00E87A' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }}
                >{c}</button>
              ))}
            </div>
          </div>
          <input className="input-green" placeholder="Farm area (acres)" value={form.area} onChange={e => f('area', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Start date</p>
              <input type="date" className="input-green" value={form.startDate} onChange={e => f('startDate', e.target.value)} />
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>End date</p>
              <input type="date" className="input-green" value={form.endDate} onChange={e => f('endDate', e.target.value)} />
            </div>
          </div>
          <textarea className="input-green resize-none" rows={3} placeholder="Notes (optional)" value={form.notes} onChange={e => f('notes', e.target.value)} />
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={save} disabled={!form.crop || !form.startDate} className="btn-primary flex-1">Save Plan</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CalendarTab() {
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try { setPlans(JSON.parse(localStorage.getItem(PLAN_KEY) ?? '[]')); } catch { setPlans([]); }
  }, []);

  const save = (updated: CropPlan[]) => {
    setPlans(updated);
    localStorage.setItem(PLAN_KEY, JSON.stringify(updated));
  };

  const add = (p: CropPlan) => save([...plans, p]);
  const del = (id: string) => save(plans.filter(p => p.id !== id));

  const today = new Date();
  const upcoming = plans.filter(p => !p.endDate || new Date(p.endDate) >= today);
  const past = plans.filter(p => p.endDate && new Date(p.endDate) < today);

  const PlanCard = ({ plan }: { plan: CropPlan }) => {
    const start = plan.startDate ? new Date(plan.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—';
    const end = plan.endDate ? new Date(plan.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
    const active = plan.startDate && plan.endDate
      ? today >= new Date(plan.startDate) && today <= new Date(plan.endDate)
      : false;
    return (
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 flex items-start gap-4"
        style={{ border: active ? '1px solid rgba(0,232,122,0.2)' : '1px solid rgba(0,232,122,0.06)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,232,122,0.08)' }}>
          <Leaf size={16} style={{ color: '#00E87A' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm" style={{ color: '#DCF5E2' }}>{plan.crop}</h3>
            {active && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,232,122,0.1)', color: '#00E87A' }}>Active</span>}
          </div>
          {plan.area && <p className="text-xs mb-0.5" style={{ color: '#3D6645' }}>{plan.area} acres</p>}
          <p className="text-xs" style={{ color: '#2A4A30' }}>{start} → {end}</p>
          {plan.notes && <p className="text-xs mt-1 line-clamp-1" style={{ color: '#2A4A30' }}>{plan.notes}</p>}
        </div>
        <button onClick={() => del(plan.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-900/20">
          <Trash2 size={13} style={{ color: '#3D6645' }} />
        </button>
      </motion.div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--muted)' }}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </p>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
          <Plus size={13} /> Add Plan
        </motion.button>
      </div>

      {plans.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CalendarDays size={36} className="mx-auto mb-4 opacity-20" style={{ color: '#00E87A' }} />
          <p className="font-semibold" style={{ color: '#3D6645' }}>No crop plans yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Add your first plan to track your farming calendar</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {upcoming.length > 0 && (
            <>
              {upcoming.map(p => <PlanCard key={p.id} plan={p} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <p className="text-xs uppercase tracking-widest pt-2" style={{ color: '#2A4A30' }}>Completed</p>
              {past.map(p => <PlanCard key={p.id} plan={p} />)}
            </>
          )}
        </div>
      )}

      <AnimatePresence>
        {showAdd && <AddPlanModal onClose={() => setShowAdd(false)} onSave={add} />}
      </AnimatePresence>
    </div>
  );
}

function RotationTab() {
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [history, setHistory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rotations: RotationCrop[]; threeYearStrategy?: string; soilHealthOutlook?: string; marketOutlook?: string } | null>(null);
  const [error, setError] = useState('');
  const [raw, setRaw] = useState('');

  const run = async () => {
    if (!crop) return;
    setLoading(true); setError(''); setResult(null); setRaw('');
    try {
      const res = await planCrop({ task: 'rotation', crop, area: area || '1', notes: history });
      if (res.status === 'error') { setError((res as { message?: string }).message ?? 'Failed'); return; }
      if (res.result) setResult(res.result as typeof result);
      else if (res.rawText) setRaw(res.rawText);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="glass rounded-2xl p-5 mb-5">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>Current / last crop</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CROPS.map(c => (
            <button key={c} onClick={() => setCrop(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={crop === c
                ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.35)', color: '#00E87A' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }}
            >{c}</button>
          ))}
        </div>
        <input className="input-green mb-3" placeholder="Farm size (acres)" value={area} onChange={e => setArea(e.target.value)} />
        <textarea className="input-green resize-none mb-4" rows={2} placeholder="History / context (optional)" value={history} onChange={e => setHistory(e.target.value)} />
        <motion.button
          whileHover={crop && !loading ? { scale: 1.02 } : {}}
          whileTap={crop && !loading ? { scale: 0.97 } : {}}
          onClick={run} disabled={!crop || loading}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={crop && !loading
            ? { background: 'linear-gradient(135deg,#00E87A,#00C55A)', color: '#020A04' }
            : { background: 'rgba(0,232,122,0.08)', color: '#3D6645', cursor: 'not-allowed' }}
        >
          {loading ? <><Loader2 size={15} className="animate-spin" />Generating rotation…</> : <><RotateCw size={15} />Get AI Rotation Strategy</>}
        </motion.button>
      </div>

      {error && <p className="text-sm mb-4" style={{ color: '#FF8080' }}>{error}</p>}

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {result.rotations?.map((r, i) => (
            <div key={i} className="glass rounded-2xl p-5" style={{ border: '1px solid rgba(0,232,122,0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: 'rgba(0,232,122,0.12)', color: '#00E87A' }}>{i + 1}</div>
                <h3 className="font-bold" style={{ color: '#DCF5E2' }}>{r.crop}</h3>
                {r.duration && <span className="text-xs ml-auto" style={{ color: '#3D6645' }}>{r.duration}</span>}
              </div>
              <p className="text-xs leading-relaxed mb-2" style={{ color: '#7CB87E' }}>{r.agronomicReason}</p>
              {r.budget && <p className="text-xs font-semibold" style={{ color: '#FFB800' }}>Budget: {r.budget}</p>}
              {r.marketOutlook && <p className="text-xs mt-1" style={{ color: '#3D6645' }}>{r.marketOutlook}</p>}
            </div>
          ))}
          {result.threeYearStrategy && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: '#00E87A' }}>3-Year Strategy</p>
              <p className="text-xs leading-relaxed" style={{ color: '#7CB87E' }}>{result.threeYearStrategy}</p>
            </div>
          )}
          {result.soilHealthOutlook && (
            <div className="glass rounded-2xl p-4">
              <p className="text-xs font-semibold mb-1" style={{ color: '#00E87A' }}>Soil Health</p>
              <p className="text-xs leading-relaxed" style={{ color: '#7CB87E' }}>{result.soilHealthOutlook}</p>
            </div>
          )}
        </motion.div>
      )}
      {raw && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5">
          <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: '#7CB87E' }}>{raw}</p>
        </motion.div>
      )}
    </div>
  );
}

function BudgetTab() {
  const [crop, setCrop] = useState('');
  const [area, setArea] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState<{ totalCost?: number; expectedRevenue?: number; roi?: string; netProfit?: number } | null>(null);

  const run = async () => {
    if (!crop) return;
    setLoading(true); setError(''); setItems([]); setSummaryData(null);
    try {
      const res = await planCrop({ task: 'budget', crop, area: area || '1', startDate, endDate, notes });
      if (res.status === 'error') { setError((res as { message?: string }).message ?? 'Failed'); return; }
      const r = res.result as { inputs?: BudgetItem[]; totalCost?: number; expectedRevenue?: number; roi?: string; netProfit?: number } | null;
      if (r) {
        setItems(r.inputs ?? []);
        setSummaryData({ totalCost: r.totalCost, expectedRevenue: r.expectedRevenue, roi: r.roi, netProfit: r.netProfit });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const total = items.reduce((s, i) => s + (i.totalCost ?? 0), 0);

  return (
    <div>
      <div className="glass rounded-2xl p-5 mb-5">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>Crop</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {CROPS.map(c => (
            <button key={c} onClick={() => setCrop(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={crop === c
                ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.35)', color: '#00E87A' }
                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }}
            >{c}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input className="input-green" placeholder="Area (acres)" value={area} onChange={e => setArea(e.target.value)} />
          <input type="date" className="input-green" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <input type="date" className="input-green mb-3" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="End date" />
        <textarea className="input-green resize-none mb-4" rows={2} placeholder="Notes / context" value={notes} onChange={e => setNotes(e.target.value)} />
        <motion.button
          whileHover={crop && !loading ? { scale: 1.02 } : {}}
          whileTap={crop && !loading ? { scale: 0.97 } : {}}
          onClick={run} disabled={!crop || loading}
          className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
          style={crop && !loading
            ? { background: 'linear-gradient(135deg,#00E87A,#00C55A)', color: '#020A04' }
            : { background: 'rgba(0,232,122,0.08)', color: '#3D6645', cursor: 'not-allowed' }}
        >
          {loading ? <><Loader2 size={15} className="animate-spin" />Generating budget…</> : <><Wallet size={15} />Generate AI Budget</>}
        </motion.button>
      </div>

      {error && <p className="text-sm mb-4" style={{ color: '#FF8080' }}>{error}</p>}

      {items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(0,232,122,0.08)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Line Items</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(0,232,122,0.05)' }}>
              {items.map((item, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: '#DCF5E2' }}>{item.name}</p>
                    <p className="text-xs" style={{ color: '#3D6645' }}>{item.category} · {item.quantity} {item.unit}</p>
                    {item.agronProduct && (
                      <p className="text-[10px] mt-0.5" style={{ color: '#00E87A' }}>Available at Agron Store: {item.agronProduct}</p>
                    )}
                  </div>
                  <p className="font-bold text-sm flex-shrink-0" style={{ color: '#DCF5E2' }}>
                    UGX {(item.totalCost ?? 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="glass-strong rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Cost</p>
              <p className="text-lg font-black" style={{ color: '#DCF5E2' }}>UGX {(summaryData?.totalCost ?? total).toLocaleString()}</p>
            </div>
            {summaryData?.expectedRevenue && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Expected Revenue</p>
                <p className="text-lg font-black" style={{ color: '#00E87A' }}>UGX {summaryData.expectedRevenue.toLocaleString()}</p>
              </div>
            )}
            {summaryData?.netProfit !== undefined && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Net Profit</p>
                <p className="text-lg font-black" style={{ color: summaryData.netProfit >= 0 ? '#00E87A' : '#FF4545' }}>
                  UGX {summaryData.netProfit.toLocaleString()}
                </p>
              </div>
            )}
            {summaryData?.roi && (
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>ROI</p>
                <p className="text-lg font-black" style={{ color: '#FFB800' }}>{summaryData.roi}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const SUB_TABS: { id: SubTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'calendar', label: 'Calendar',  icon: CalendarDays, desc: 'Plan & track crop cycles' },
  { id: 'rotation', label: 'Rotation',  icon: RotateCw,     desc: 'AI rotation strategy' },
  { id: 'budget',   label: 'Budget',    icon: Wallet,        desc: 'AI-powered cost plan' },
];

export default function PlanPage() {
  const [tab, setTab] = useState<SubTab>('calendar');

  return (
    <div className="min-h-screen px-6 md:px-14 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
              <Sparkles size={18} style={{ color: '#00E87A' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: '#DCF5E2' }}>AI Plan</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Powered by Agron AI agent</p>
            </div>
          </div>
          <p className="text-sm" style={{ color: '#3D6645' }}>
            Plan your crop calendar, get rotation strategies, and generate cost budgets using live store prices.
          </p>
        </motion.div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 gap-2 mb-7">
          {SUB_TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <motion.button
                key={t.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => setTab(t.id)}
                className="rounded-2xl p-4 text-left transition-all"
                style={active
                  ? { background: 'rgba(0,232,122,0.1)', border: '1px solid rgba(0,232,122,0.25)' }
                  : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Icon size={16} className="mb-2" style={{ color: active ? '#00E87A' : '#3D6645' }} />
                <p className="text-xs font-bold" style={{ color: active ? '#DCF5E2' : '#5A7A5E' }}>{t.label}</p>
                <p className="text-[10px] mt-0.5 hidden sm:block" style={{ color: active ? '#3D6645' : '#2A4A30' }}>{t.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {tab === 'calendar' && <CalendarTab />}
            {tab === 'rotation' && <RotationTab />}
            {tab === 'budget'   && <BudgetTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
