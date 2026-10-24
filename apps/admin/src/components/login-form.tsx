"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/button";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        rememberMe: formData.get("remember") === "on",
      });
      if (result.error) {
        setError(result.error.message ?? "Could not sign in");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid w-full max-w-xs gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Operator sign in</h1>
        <p className="mt-1 text-sm text-body">OpenChurch staff only.</p>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" autoComplete="email" required className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      <div className="grid gap-1">
        <div className="flex items-center justify-between text-sm font-medium">
          <label htmlFor="password">Password</label>
          <a href="/forgot-password" className="font-normal underline-offset-4 hover:underline">
            Forgot password?
          </a>
        </div>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="h-11 rounded-xl border border-line bg-white px-3" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="remember" type="checkbox" defaultChecked className="size-4 accent-action" />
        Remember me
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} className="h-11">
        Sign in
      </Button>
    </form>
  );
}
