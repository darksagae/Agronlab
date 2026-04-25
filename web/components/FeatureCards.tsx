'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ScanLine, ShoppingBag, Globe, Zap, Shield, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: ScanLine,
    color: '#4ADE80',
    glow: 'rgba(74,222,128,0.2)',
    title: 'AI Disease Detection',
    desc: 'Photograph any crop and get an instant diagnosis powered by Gemini Vision. Supports cassava, maize, tomatoes, and 9 more crops.',
    tag: 'Powered by Agron AI',
  },
  {
    icon: ShoppingBag,
    color: '#22D3EE',
    glow: 'rgba(34,211,238,0.2)',
    title: 'P2P Marketplace',
    desc: 'Buy and sell directly with verified farmers in your region. No middlemen. Encrypted messaging and secure payments.',
    tag: 'East Africa',
  },
  {
    icon: Globe,
    color: '#A78BFA',
    glow: 'rgba(167,139,250,0.2)',
    title: 'Multilingual',
    desc: 'Support for 50+ languages across almost every country in the world — built for the farmers who grow the food, in the language they speak.',
    tag: '50+ Languages',
  },
  {
    icon: Zap,
    color: '#FB923C',
    glow: 'rgba(251,146,60,0.2)',
    title: 'Offline-First',
    desc: 'Works without internet. Data syncs when connectivity returns. Your farm data stays on your device.',
    tag: 'Local-first SQLite',
  },
  {
    icon: Shield,
    color: '#F472B6',
    glow: 'rgba(244,114,182,0.2)',
    title: 'End-to-End Encrypted',
    desc: 'Farmer-to-farmer chat is encrypted with X25519 keys. Messages are unreadable to anyone but you and your recipient.',
    tag: 'TweetNaCl',
  },
  {
    icon: TrendingUp,
    color: '#FBBF24',
    glow: 'rgba(251,191,36,0.2)',
    title: 'Market Intelligence',
    desc: 'See price trends, demand signals, and buy requests in your region. Know when and where to sell for the best price.',
    tag: 'Real-time data',
  },
];

function Card({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const Icon = feature.icon;
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setRotation({ x: (y - cy) / 14, y: (cx - x) / 14 });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.1,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setRotation({ x: 0, y: 0 }); }}
      animate-card
      style={{
        transform: hovering
          ? `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(4px)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg)',
        transition: 'transform 0.15s ease',
      }}
      className="relative group cursor-default"
    >
      {/* Card glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${feature.glow} 0%, transparent 60%)`,
          filter: 'blur(1px)',
        }}
      />

      {/* Card */}
      <div
        className="relative glass rounded-2xl p-6 h-full"
        style={{
          border: hovering
            ? `1px solid ${feature.color}30`
            : '1px solid rgba(255,255,255,0.06)',
          transition: 'border-color 0.3s ease',
        }}
      >
        {/* Icon circle */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: `${feature.glow}`,
            border: `1px solid ${feature.color}40`,
          }}
        >
          <Icon size={20} style={{ color: feature.color }} strokeWidth={1.8} />
        </div>

        {/* Tag */}
        <span
          className="text-[10px] font-semibold tracking-widest uppercase mb-3 block"
          style={{ color: `${feature.color}99` }}
        >
          {feature.tag}
        </span>

        <h3 className="text-base font-bold text-white mb-2 leading-snug">
          {feature.title}
        </h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>

        {/* Spotlight cursor effect */}
        {hovering && (
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${50 + rotation.y * 3}% ${50 - rotation.x * 3}%, ${feature.color}08 0%, transparent 60%)`,
            }}
          />
        )}
      </div>
    </motion.div>
  );
}

export function FeatureCards() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 px-8 md:px-16">
      <div ref={ref} className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span
            className="text-xs font-semibold tracking-[0.2em] uppercase mb-4 block"
            style={{ color: '#4ADE80' }}
          >
            Everything you need
          </span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black text-white leading-tight tracking-tight">
            Built for farmers,{' '}
            <span className="gradient-text">by technologists</span>
            <br />
            who understand both.
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <Card key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
