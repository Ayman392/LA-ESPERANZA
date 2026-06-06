import { clsx } from "clsx";
import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
};

const variants = {
  primary:
    "btn-primary-luxury bg-charcoal text-white shadow-soft hover:bg-[#38352f]",
  secondary:
    "btn-secondary-luxury border border-border bg-surface-strong text-charcoal hover:bg-white",
};

const sizes = {
  sm: "h-11 px-5 text-sm",
  md: "h-12 px-6 text-sm",
};

// Reusable rounded button foundation for links and actions across future routes.
export function Button({
  children,
  className,
  href,
  size = "md",
  variant = "primary",
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-background",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}
