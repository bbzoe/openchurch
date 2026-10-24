"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const invalid = params.get("error") === "INVALID_TOKEN" || !token;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    if (!token) return;
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(result.error.message ?? "This reset link is no longer valid.");
        return;
      }
      router.push("/sign-in");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (invalid) {
    return (
      <div className="grid w-full max-w-xs gap-3 text-center">
        <h1 className="text-2xl font-bold">This link is not valid</h1>
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid w-full max-w-xs gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        New password
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Confirm password
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} className="h-11">
        Save password
      </Button>
    </form>
  );
}
