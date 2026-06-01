import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
