import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "gold" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-domify-primary text-white shadow-[0_14px_24px_-14px_rgba(16,47,66,0.9)] hover:bg-domify-primary-dark",
  gold: "bg-domify-gold text-white shadow-[0_14px_24px_-14px_rgba(189,145,74,0.9)] hover:bg-domify-soft-gold hover:text-domify-primary-dark",
  outline: "border border-domify-primary/25 bg-white text-domify-primary hover:border-domify-primary hover:bg-domify-primary hover:text-white",
  ghost: "text-domify-primary hover:bg-domify-warm-white hover:text-domify-primary-dark",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Shadcn-style project primitive. Centralizing button states prevents visual and
 * accessibility drift across forms, dialogs, and conversion actions.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "pressable inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-luxury focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-domify-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
