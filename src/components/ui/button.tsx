import { clsx } from "clsx";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
};

const variants = {
  primary: "bg-charcoal text-white shadow-soft hover:bg-[#38352f]",
  secondary: "border border-border bg-surface-strong text-charcoal hover:border-accent/45 hover:bg-white",
};

const sizes = {
  sm: "h-11 px-5 text-sm",
  md: "h-12 px-6 text-sm",
};

export function Button({
  children,
  className,
  href,
  size = "md",
  variant = "primary",
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-background",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes}>
      {children}
    </button>
  );
}
