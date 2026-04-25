'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

function useCounter(end: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration, started]);

  return count;
}

function StatItem({
  value,
  suffix,
  label,
  started,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  started: boolean;
  delay: number;
}) {
  const count = useCounter(value, 2200, started);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={started ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="text-[clamp(2.5rem,5vw,4rem)] font-black leading-none tracking-tighter gradient-text">
        {count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-sm text-zinc-500 mt-2 tracking-wide">{label}</div>
    </motion.div>
  );
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="py-20 px-8 md:px-16 relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(22,163,74,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        ref={ref}
        className="glass max-w-4xl mx-auto rounded-3xl py-12 px-8 relative"
        style={{ border: '1px solid rgba(74,222,128,0.1)' }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <StatItem value={2400} suffix="+" label="Active farmers" started={inView} delay={0} />
          <StatItem value={95} suffix="%" label="Detection accuracy" started={inView} delay={0.1} />
          <StatItem value={12} suffix="" label="Crop types supported" started={inView} delay={0.2} />
          <StatItem value={50} suffix="+" label="Languages supported" started={inView} delay={0.3} />
        </div>
      </div>
    </section>
  );
}
