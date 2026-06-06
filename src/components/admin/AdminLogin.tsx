"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Invalid admin email or password.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Invalid admin email or password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md rounded-card border border-border bg-surface-strong p-6 shadow-soft"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-accent">
        <LockKeyhole aria-hidden className="h-5 w-5" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase text-accent">
        Admin Login
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-charcoal">
        LA ESPERANZA access
      </h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-charcoal">
          Admin email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-12 w-full rounded-card border border-border bg-background px-4 text-sm text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="admin@example.com"
            autoComplete="username"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-charcoal">
          Admin password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-12 w-full rounded-card border border-border bg-background px-4 text-sm text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            placeholder="Enter admin password"
            autoComplete="current-password"
            required
          />
        </label>
        {error ? (
          <div
            role="alert"
            className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={!email || !password || isSubmitting}
          className="h-12 w-full rounded-full bg-charcoal px-6 text-sm font-semibold text-white transition hover:bg-[#38352f] focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </motion.section>
  );
}
