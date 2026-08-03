"use client";

import { motion } from "framer-motion";

// A plain re-export would work too, but naming it explicitly keeps call sites
// readable (`<MotionDiv>` vs a bare `<motion.div>` inside a Server Component file).
export const MotionDiv = motion.div;
