"use client";

import { motion, useReducedMotion } from "framer-motion";

const revealEase = [0.23, 1, 0.32, 1] as const;

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

/**
 * A restrained viewport reveal for editorial content. Motion is removed entirely
 * when the visitor has requested reduced motion.
 */
export function FadeIn({ children, delay = 0, y = 18, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-72px" }}
      transition={{ duration: 0.46, delay, ease: revealEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wrap a collection to introduce its direct children with a short, controlled
 * cascade rather than a visually noisy simultaneous reveal.
 */
export function StaggerReveal({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "show"}
      viewport={{ once: true, margin: "-72px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: revealEase } },
};
