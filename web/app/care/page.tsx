'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Upload, Camera, Leaf, AlertTriangle, CheckCircle, Loader2, Lock, Sparkles, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { analyzeDisease, type DiagnosisResult } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const CROPS = ['Cassava','Maize','Tomato','Bean','Banana','Sweet Potato','Sorghum','Groundnut','Coffee','Tea','Rice','Wheat'];

const severityColor: Record<string, string> = {
  low:      '#00E87A',
  mild:     '#FFB800',
  moderate: '#FF7A00',
  high:     '#FF4545',
  severe:   '#FF0000',
  unknown:  '#3D6645',
};

const PROMO_KEY = 'agron_promo_premium';

export default function CarePage() {
  const { user } = useAuth();
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop]       = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<DiagnosisResult | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoMsg, setPromoMsg] = useState('');
  const [isPremium, setIsPremium] = useState(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem(PROMO_KEY);
      if (val) {
        const exp = new Date(val);
        return exp > new Date();
      }
    }
    return false;
  });

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  }, []);

  const applyPromo = () => {
    if (promoInput.toLowerCase().trim() === 'sti') {
      const exp = new Date();
      exp.setFullYear(exp.getFullYear() + 1);
      localStorage.setItem(PROMO_KEY, exp.toISOString());
      setIsPremium(true);
      setPromoMsg('✓ Premium unlocked! Full AI analysis enabled.');
      setPromoInput('');
    } else {
      setPromoMsg('Invalid promo code.');
    }
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDisease(file, {
        isPremium,
        cropType: crop,
        userSub: user?.sub,
        country: 'UG',
      });
      if (res.status === 'error') { setError(res.message ?? 'Analysis failed'); return; }
      setResult(res.analysis ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sev = result?.severity_level?.toLowerCase() ?? 'unknown';
  const sevColor = severityColor[sev] ?? '#3D6645';

  return (
    <div className="min-h-screen px-6 md:px-14 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glass">
              <ScanLine size={18} style={{ color: '#00E87A' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight" style={{ color: '#DCF5E2' }}>AI Care</h1>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Powered by Agron AI agent</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: '#3D6645' }}>
            Upload a photo of any crop. Get an instant diagnosis with treatment recommendations.
          </p>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !preview && inputRef.current?.click()}
          className="relative rounded-3xl mb-5 overflow-hidden cursor-pointer transition-all duration-300"
          style={{
            border: dragging
              ? '2px solid rgba(0,232,122,0.5)'
              : preview
              ? '1px solid rgba(0,232,122,0.15)'
              : '2px dashed rgba(0,232,122,0.18)',
            background: dragging ? 'rgba(0,232,122,0.06)' : 'rgba(0,232,122,0.02)',
            minHeight: preview ? 280 : 200,
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />

          {preview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="crop" className="w-full object-cover rounded-3xl" style={{ maxHeight: 380 }} />
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setResult(null); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(0,0,0,0.7)', color: '#DCF5E2', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 glass"
              >
                <Upload size={22} style={{ color: '#00E87A' }} />
              </motion.div>
              <p className="font-semibold mb-1" style={{ color: '#DCF5E2' }}>Drop crop photo here</p>
              <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>PNG · JPG · WEBP · up to 10 MB</p>
              <div className="flex gap-3">
                <button className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
                  <Upload size={13} /> Browse
                </button>
                <button className="btn-ghost text-xs px-5 py-2.5 flex items-center gap-2">
                  <Camera size={13} /> Camera
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Crop type */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }} className="mb-5">
          <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Crop type (optional)</p>
          <div className="flex flex-wrap gap-2">
            {CROPS.map((c, i) => (
              <motion.button
                key={c}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + i * 0.02 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setCrop(crop === c ? '' : c)}
                className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all"
                style={
                  crop === c
                    ? { background: 'rgba(0,232,122,0.15)', border: '1px solid rgba(0,232,122,0.35)', color: '#00E87A' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#3D6645' }
                }
              >
                <Leaf size={10} style={{ color: crop === c ? '#00E87A' : '#3D6645' }} />
                {c}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Premium badge / promo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.17 }} className="mb-5">
          {isPremium ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(255,191,0,0.08)', border: '1px solid rgba(255,191,0,0.2)', color: '#FFB800' }}>
              <Sparkles size={12} />
              Premium AI analysis active
            </div>
          ) : (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(0,232,122,0.04)', border: '1px solid rgba(0,232,122,0.1)' }}>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Have a promo code? Unlock full premium AI analysis:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => setPromoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                  placeholder="Enter code"
                  className="flex-1 text-xs rounded-lg px-3 py-1.5 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#DCF5E2' }}
                />
                <button
                  onClick={applyPromo}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'rgba(0,232,122,0.12)', color: '#00E87A', border: '1px solid rgba(0,232,122,0.2)' }}
                >
                  Apply
                </button>
              </div>
              {promoMsg && (
                <p className="text-xs" style={{ color: promoMsg.startsWith('✓') ? '#00E87A' : '#FF4545' }}>{promoMsg}</p>
              )}
            </div>
          )}
        </motion.div>

        {/* Analyze button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.button
            whileHover={file && !loading ? { scale: 1.02, boxShadow: '0 0 40px rgba(0,232,122,0.3)' } : {}}
            whileTap={file && !loading ? { scale: 0.97 } : {}}
            onClick={analyze}
            disabled={!file || loading}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all"
            style={
              file && !loading
                ? { background: 'linear-gradient(135deg, #00E87A, #00C55A)', color: '#020A04' }
                : { background: 'rgba(0,232,122,0.08)', color: '#3D6645', cursor: 'not-allowed' }
            }
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Analysing crop...
              </>
            ) : (
              <>
                <ScanLine size={17} />
                Analyse Now
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(255,69,69,0.08)', border: '1px solid rgba(255,69,69,0.2)' }}>
            <AlertTriangle size={16} style={{ color: '#FF4545', flexShrink: 0, marginTop: 2 }} />
            <p className="text-sm" style={{ color: '#FF8080' }}>{error}</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 space-y-4"
            >
              {/* Status card */}
              <div
                className="glass-strong rounded-3xl p-6"
                style={{ borderColor: `${sevColor}30` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {result.health_status === 'healthy'
                        ? <CheckCircle size={16} style={{ color: '#00E87A' }} />
                        : <AlertTriangle size={16} style={{ color: sevColor }} />
                      }
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: sevColor }}>
                        {result.health_status}
                      </span>
                    </div>
                    <h2 className="text-xl font-black" style={{ color: '#DCF5E2' }}>
                      {result.disease_type}
                    </h2>
                    {result.causal_agent && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        Caused by: {result.causal_agent}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: '#00E87A' }}>
                      {Math.round((result.confidence || 0) * 100)}%
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--muted)' }}>confidence</p>
                  </div>
                </div>

                {/* Severity bar */}
                <div className="h-1.5 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((result.confidence || 0) * 100)}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${sevColor}, ${sevColor}88)` }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#7CB87E' }}>
                    {result.crop_type}
                  </span>
                  {result.severity_level !== 'unknown' && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: `${sevColor}15`, color: sevColor }}>
                      {result.severity_level} severity
                    </span>
                  )}
                  {result.urgency && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,184,0,0.1)', color: '#FFB800' }}>
                      {result.urgency}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Preview (free plan) */}
              {result.ai_preview && (
                <div className="glass rounded-2xl p-5" style={{ borderColor: 'rgba(0,232,122,0.1)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={13} style={{ color: '#00E87A' }} />
                    <span className="text-xs font-semibold" style={{ color: '#00E87A' }}>AI Preview</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#7CB87E' }}>{result.ai_preview}</p>
                </div>
              )}

              {/* Symptoms */}
              {result.symptoms?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#DCF5E2' }}>Symptoms observed</h3>
                  <ul className="space-y-1.5">
                    {result.symptoms.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#7CB87E' }}>
                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#00E87A' }} />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="glass rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-3" style={{ color: '#DCF5E2' }}>Recommendations</h3>
                  <ol className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-3 text-sm" style={{ color: '#7CB87E' }}>
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(0,232,122,0.1)', color: '#00E87A' }}>
                          {i + 1}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Product recommendations */}
              {result.products_to_use && result.products_to_use.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass rounded-2xl p-5"
                  style={{ border: '1px solid rgba(0,232,122,0.1)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={13} style={{ color: '#00E87A' }} />
                      <span className="text-sm font-bold" style={{ color: '#DCF5E2' }}>Recommended products</span>
                    </div>
                    <Link href="/store">
                      <button className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#00E87A' }}>
                        Shop <ChevronRight size={11} />
                      </button>
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.products_to_use.map((p, i) => (
                      <Link key={i} href={`/store?search=${encodeURIComponent(p)}`}>
                        <motion.span
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer"
                          style={{ background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.15)', color: '#7CB87E' }}
                        >
                          <ShoppingBag size={10} style={{ color: '#00E87A' }} />
                          {p}
                        </motion.span>
                      </Link>
                    ))}
                  </div>
                  {result.application_method && (
                    <p className="text-xs mt-3 leading-relaxed" style={{ color: '#3D6645' }}>
                      <span className="font-semibold" style={{ color: '#7CB87E' }}>Application: </span>
                      {result.application_method}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Upgrade prompt */}
              {result.upgrade_prompt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="glass-strong rounded-3xl p-6 relative overflow-hidden"
                  style={{ borderColor: 'rgba(0,232,122,0.2)' }}
                >
                  <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #00E87A, transparent 70%)' }} />
                  <Lock size={20} style={{ color: '#00E87A' }} className="mb-3" />
                  <h3 className="font-black text-lg mb-2" style={{ color: '#DCF5E2' }}>{result.upgrade_prompt.title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#3D6645' }}>{result.upgrade_prompt.body}</p>
                  <div className="flex items-center gap-4">
                    <Link href="/account">
                      <button className="btn-primary text-sm px-6 py-2.5">Upgrade to Premium</button>
                    </Link>
                    <span className="text-sm font-bold grad">{result.upgrade_prompt.price}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
