import type { Metadata } from "next";
import "./globals.css";

// App-level metadata stays intentionally broad until ecommerce pages are introduced.
export const metadata: Metadata = {
  title: "LA ESPERANZA | Perfume Ecommerce",
  description: "A soft, refined foundation for the LA ESPERANZA perfume ecommerce experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* The body is kept minimal so route-level layouts can evolve cleanly. */}
      <body>{children}</body>
    </html>
  );
}
