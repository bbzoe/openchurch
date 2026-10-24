"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
      <div className="grid gap-3 text-center">
        <h1 className="text-2xl font-bold">This link is not valid</h1>
        <p className="text-sm text-muted-foreground">Ask for a new reset link and try again.</p>
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">At least 8 characters.</p>
        </div>
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="bg-background" />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="bg-background" />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Field>
          <Button type="submit" disabled={pending} className="h-10">
            Save password
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
