import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { formatMoney } from "../../lib/utils";

/** Smoothly tweens between money values whenever `value` changes. */
export function AnimatedMoney({
  value,
  className,
  precise = false,
}: {
  value: number;
  className?: string;
  precise?: boolean;
}) {
  const mv = useMotionValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return controls.stop;
  }, [value, mv]);

  return (
    <span className={`tabular ${className ?? ""}`}>
      {formatMoney(precise ? display : Math.round(display), precise)}
    </span>
  );
}
