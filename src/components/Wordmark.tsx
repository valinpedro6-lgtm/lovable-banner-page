import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

const WORD = "lovable";
const RADIUS = 180; // px — area of cursor influence
const PUSH = 10; // px — max repel distance
const BASE_WEIGHT = 300;
const PEAK_WEIGHT = 430;
const EASE = [0.22, 1, 0.36, 1] as const;

const waveVariants: Variants = {
  rest: { y: 0, scale: 1 },
  wave: (i: number) => ({
    y: ["0em", "-0.09em", "0.02em", "0em"],
    scale: [1, 1.04, 0.995, 1],
    transition: { duration: 1.1, delay: i * 0.07, ease: EASE, times: [0, 0.4, 0.75, 1] },
  }),
};

function Letter({
  char,
  index,
  mx,
  my,
  reduced,
  controls,
}: {
  char: string;
  index: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  reduced: boolean;
  controls: ReturnType<typeof useAnimationControls>;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const center = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    measure();
    const t = window.setTimeout(measure, 1400);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const influence = useTransform([mx, my], ([x, y]: number[]) => {
    const dx = (x ?? -9999) - center.current.x;
    const dy = (y ?? -9999) - center.current.y;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) return 0;
    const t = 1 - d / RADIUS;
    return t * t * (3 - 2 * t); // smoothstep
  });

  const rawX = useTransform([mx, my, influence], ([x, y, f]: number[]) => {
    const dx = (x ?? 0) - center.current.x;
    const dy = (y ?? 0) - center.current.y;
    const d = Math.hypot(dx, dy) || 1;
    return (-dx / d) * PUSH * (f ?? 0);
  });
  const rawY = useTransform([mx, my, influence], ([x, y, f]: number[]) => {
    const dx = (x ?? 0) - center.current.x;
    const dy = (y ?? 0) - center.current.y;
    const d = Math.hypot(dx, dy) || 1;
    return (-dy / d) * PUSH * 0.6 * (f ?? 0);
  });
  const rawW = useTransform(influence, (f) => BASE_WEIGHT + (PEAK_WEIGHT - BASE_WEIGHT) * f);

  const spring = { stiffness: 170, damping: 20, mass: 0.6 };
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);
  const fontWeight = useSpring(rawW, spring);

  return (
    <motion.span
      aria-hidden="true"
      className="inline-block"
      initial={reduced ? false : { opacity: 0, y: "0.25em", filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: 0.15 + index * 0.075, ease: EASE }}
    >
      <motion.span
        ref={ref}
        className="inline-block will-change-transform"
        style={reduced ? undefined : { x, y, fontWeight }}
      >
        <motion.span
          className="inline-block"
          custom={index}
          variants={waveVariants}
          initial="rest"
          animate={controls}
        >
          {char}
        </motion.span>
      </motion.span>
    </motion.span>
  );
}

export function Wordmark() {
  const reduced = useReducedMotion() ?? false;
  const controls = useAnimationControls();
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);

  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    const onLeave = () => {
      mx.set(-9999);
      my.set(-9999);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [mx, my, reduced]);

  const breathe = useCallback(() => {
    if (reduced) return;
    controls.stop();
    controls.set("rest");
    void controls.start("wave");
  }, [controls, reduced]);

  return (
    <h1
      onClick={breathe}
      className="wordmark cursor-default whitespace-nowrap px-4 text-foreground"
    >
      <span className="sr-only">{WORD}</span>
      {WORD.split("").map((char, i) => (
        <Letter
          key={i}
          char={char}
          index={i}
          mx={mx}
          my={my}
          reduced={reduced}
          controls={controls}
        />
      ))}
    </h1>
  );
}
