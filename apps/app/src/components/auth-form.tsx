"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    try {
      const result =
        mode === "sign-up"
          ? await authClient.signUp.email({ email, password, name })
          : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Could not continue");
        return;
      }
      router.push("/churches");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {mode === "sign-up" ? (
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input name="name" required className="h-11 rounded-xl border border-line bg-white px-3" />
        </label>
      ) : null}
      <label className="grid gap-1 text-sm font-medium">
        Email
        <input name="email" type="email" required className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Password
        <input name="password" type="password" required minLength={8} className="h-11 rounded-xl border border-line bg-white px-3" />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} className="h-11 rounded-full font-semibold">
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>
    </form>
  );
}
