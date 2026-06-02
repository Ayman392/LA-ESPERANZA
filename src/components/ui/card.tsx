import { clsx } from "clsx";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

// Rounded card primitive used for brand, content, and future product surfaces.
export function Card({ children, className }: CardProps) {
  return (
    <article
      className={clsx(
        "rounded-card border border-border/80 bg-surface-strong shadow-[0_18px_55px_rgba(38,36,33,0.06)]",
        className,
      )}
    >
      {children}
    </article>
  );
}
