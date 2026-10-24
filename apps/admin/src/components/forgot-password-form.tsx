"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.requestPasswordReset({
        email: String(formData.get("email") ?? ""),
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not send the reset email");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="grid w-full max-w-xs gap-3 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-body">If an account exists for that address, a reset link is on its way.</p>
        <Link href="/sign-in" className="text-sm underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid w-full max-w-xs gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-1 text-sm text-body">We will email a link to choose a new password.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" required className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} className="h-11">
        Send reset link
      </Button>
      <Link href="/sign-in" className="text-center text-sm underline underline-offset-4">
        Back to sign in
      </Link>
    </form>
  );
}
