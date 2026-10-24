"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
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
      router.push("/churches");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email to open your church.
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="m@example.com" required className="bg-background" />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} className="bg-background" />
        </Field>
        <Field orientation="horizontal">
          <input id="remember" name="remember" type="checkbox" defaultChecked className="size-4 accent-action" />
          <FieldLabel htmlFor="remember">Remember me</FieldLabel>
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Field>
          <Button type="submit" disabled={pending} className="h-10">
            Sign in
          </Button>
        </Field>
        <Field>
          <FieldDescription className="text-center">
            New here?{" "}
            <Link href="/sign-up" className="underline underline-offset-4">
              Create an account
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
