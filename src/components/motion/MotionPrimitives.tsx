"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

/**
 * A safe client boundary for motion used from Server Components. It keeps the
 * declarative Framer Motion API while removing nonessential animation when a
 * visitor requests reduced motion.
 */
export function MotionDiv({
  initial,
  animate,
  exit,
  whileInView,
  whileHover,
  whileTap,
  ...props
}: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      initial={reduceMotion ? false : initial}
      animate={reduceMotion ? undefined : animate}
      exit={reduceMotion ? undefined : exit}
      whileInView={reduceMotion ? undefined : whileInView}
      whileHover={reduceMotion ? undefined : whileHover}
      whileTap={reduceMotion ? undefined : whileTap}
    />
  );
}
