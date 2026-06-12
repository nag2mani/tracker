import { motion } from "framer-motion";
import { useMemo, useState } from "react";

const COLORS = ["#34d399", "#8b5cf6", "#f472b6", "#fbbf24", "#38bdf8", "#fb7185", "#fafafa"];

interface Particle {
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
  drift: number;
  shape: "rect" | "circle";
}

/** Deterministic PRNG so particle generation stays pure across re-renders. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lightweight DOM confetti burst — mounts, rains, and is removed by the parent. */
export function Confetti({ count = 90 }: { count?: number }) {
  // a fresh seed per mount keeps each burst unique without impure render calls
  const [seed] = useState(() => Math.floor(performance.now()) % 100000);

  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      delay: rand() * 0.35,
      duration: 1.6 + rand() * 1.4,
      size: 5 + rand() * 7,
      color: COLORS[Math.floor(rand() * COLORS.length)],
      rotate: (rand() - 0.5) * 720,
      drift: (rand() - 0.5) * 180,
      shape: rand() > 0.4 ? "rect" : "circle",
    }));
  }, [count, seed]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: "-8vh", x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "112vh", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.6, 0.6, 1] }}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.45 : p.size,
            background: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "1px",
          }}
        />
      ))}
    </div>
  );
}
