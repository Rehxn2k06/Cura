'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Particle = {
  id: number;
  left: string;
  top: string;
  opacity: number;
  glow: number;
  floatY: number;
  floatX: number;
  duration: number;
  delay: number;
};

export function BackgroundEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      opacity: 0.4 + Math.random() * 0.4,
      glow: 0.5 + Math.random() * 0.3,
      floatY: -40 - Math.random() * 50,
      floatX: -20 + Math.random() * 40,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 3,
    }));

    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      
      {/* Base background */}
      <div className="absolute inset-0 bg-[#05070D]" />

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(0, 255, 136, 0.08) 0%, rgba(6, 182, 212, 0.04) 35%, transparent 70%)',
        }}
      />

      {/* Floating gradient blobs */}
      <motion.div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(0, 255, 136, 0.15) 0%, transparent 70%)',
        }}
        animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
        }}
        animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Particles (CLIENT SAFE) */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: p.left,
            top: p.top,
            background: `rgba(0,255,136,${p.opacity})`,
            boxShadow: `0 0 10px rgba(0,255,136,${p.glow})`,
          }}
          animate={{
            y: [0, p.floatY, 0],
            x: [0, p.floatX, 0],
            opacity: [0.1, 0.8, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(5, 7, 13, 0.6) 100%)',
        }}
      />
    </div>
  );
}