'use client';

import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ScanLine, ShoppingBag, Handshake } from 'lucide-react';
import Link from 'next/link';

const headline = ['AI-Powered', 'Crop', 'Intelligence', 'for the', 'World.'];

const wordIn = {
  hidden: { y: 72, opacity: 0, filter: 'blur(12px)' },
  visible: (i: number) => ({
    y: 0, opacity: 1, filter: 'blur(0px)',
    transition: { type: 'spring', damping: 20, stiffness: 80, delay: 0.08 + i * 0.11 },
  }),
};

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  visible: (i: number) => ({
    y: 0, opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.85 + i * 0.1 },
  }),
};

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 4.7) % 90}%`,
  size: 3 + (i % 5),
  duration: 12 + (i * 2.3) % 18,
  delay: (i * 1.4) % 14,
  opacity: 0.15 + (i % 4) * 0.1,
}));

export function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();

  const bgY   = useTransform(scrollY, [0, 800], [0, -100]);
  const midY  = useTransform(scrollY, [0, 800], [0, -200]);
  const textY = useTransform(scrollY, [0, 800], [0, -280]);
  const fade  = useTransform(scrollY, [0, 420], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex items-center overflow-hidden noise"
      style={{ minHeight: '100vh', background: 'var(--ink)' }}
    >
      {/* ── Background gradient orbs ── */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 60% at 50% 110%, rgba(0,232,122,0.14) 0%, transparent 65%),
              radial-gradient(ellipse 50% 40% at 10% 60%, rgba(0,221,184,0.07) 0%, transparent 50%),
              radial-gradient(ellipse 40% 30% at 90% 30%, rgba(0,197,255,0.05) 0%, transparent 50%)
            `,
          }}
        />
        {/* Horizon glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-64"
          style={{ background: 'linear-gradient(0deg, rgba(0,232,122,0.08) 0%, transparent 100%)' }}
        />
        {/* Large background AGRON text */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          style={{ fontSize: 'clamp(10rem, 30vw, 24rem)', fontWeight: 900, color: 'rgba(0,232,122,0.025)', lineHeight: 1, letterSpacing: '-0.05em' }}
        >
          AGRON
        </div>
      </motion.div>

      {/* ── Floating particles ── */}
      <motion.div style={{ y: midY }} className="absolute inset-0 pointer-events-none">
        {/* SVG leaf shapes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 11}%`,
              top: `${20 + (i % 4) * 18}%`,
              opacity: 0.06 + (i % 3) * 0.03,
              transform: `rotate(${i * 42}deg) scale(${0.6 + (i % 3) * 0.3})`,
            }}
          >
            <svg width="48" height="72" viewBox="0 0 48 72" fill="none">
              <path d="M24 2C12 14 2 30 8 48C12 60 18 70 24 72C30 70 36 60 40 48C46 30 36 14 24 2Z" fill="#00E87A" />
              <line x1="24" y1="6" x2="24" y2="70" stroke="#00A855" strokeWidth="1.5" />
              <line x1="24" y1="24" x2="12" y2="42" stroke="#00A855" strokeWidth="0.8" />
              <line x1="24" y1="30" x2="36" y2="46" stroke="#00A855" strokeWidth="0.8" />
            </svg>
          </div>
        ))}

        {/* Dot particles */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="particle rounded-full"
            style={{
              left: p.left,
              bottom: '-8px',
              width: p.size,
              height: p.size,
              background: p.id % 3 === 0 ? '#00E87A' : p.id % 3 === 1 ? '#00DDB8' : '#00C5FF',
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </motion.div>

      {/* ── Hero content ── */}
      <motion.div
        style={{ y: textY, opacity: fade }}
        className="relative z-10 w-full max-w-5xl mx-auto px-8 md:px-16 pt-20"
      >
        {/* Badge */}
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)', color: '#00E87A' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E87A] animate-pulse" />
            Powered by Agron AI agent
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-[1.02] tracking-tighter mb-6">
          <span className="flex flex-wrap gap-x-[0.2em]">
            {headline.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordIn}
                style={{ display: 'inline-block' }}
                className={i >= 3 ? 'grad' : 'text-[#DCF5E2]'}
              >
                {word}
              </motion.span>
            ))}
          </span>
        </h1>

        {/* Sub */}
        <motion.p
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="text-lg md:text-xl max-w-xl leading-relaxed mb-10"
          style={{ color: '#3D6645' }}
        >
          Detect disease instantly. Trade globally. Access the agricultural store.
          Available in 50+ languages — built for farmers across almost every country in the world.
        </motion.p>

        {/* CTAs */}
        <motion.div custom={2} initial="hidden" animate="visible" variants={fadeUp} className="flex flex-wrap gap-3 mb-16">
          <Link href="/care">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 48px rgba(0,232,122,0.35)' }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #00E87A 0%, #00C55A 100%)', color: '#020A04' }}
            >
              <ScanLine size={16} />
              Try AI Detection
              <ArrowRight size={15} />
            </motion.button>
          </Link>

          <Link href="/market">
            <motion.button
              whileHover={{ scale: 1.02, borderColor: 'rgba(0,232,122,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-sm btn-ghost"
            >
              <Handshake size={16} />
              Browse Market
            </motion.button>
          </Link>

          <Link href="/store">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-sm btn-ghost"
            >
              <ShoppingBag size={16} />
              AGRON Store
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-wrap gap-10"
        >
          {[
            { v: '2,400+', l: 'Active users' },
            { v: '95%',    l: 'Detection accuracy' },
            { v: '50+',    l: 'Languages' },
            { v: '12',     l: 'Crop types' },
          ].map(({ v, l }) => (
            <div key={l}>
              <p className="text-2xl font-black grad">{v}</p>
              <p className="text-xs mt-0.5 tracking-wide" style={{ color: 'var(--muted)' }}>{l}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 9, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-px h-10 rounded-full"
          style={{ background: 'linear-gradient(180deg, rgba(0,232,122,0.7) 0%, transparent 100%)' }}
        />
      </motion.div>
    </section>
  );
}
