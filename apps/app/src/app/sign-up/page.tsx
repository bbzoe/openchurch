import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  return (
    <main className="mx-auto grid min-h-full max-w-md gap-6 px-6 py-16">
      <Image src="/lockup.svg" alt="OpenChurch" width={220} height={34} className="h-8 w-auto" priority />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="mt-2 text-sm text-body">Then start a church, or wait to be added to one.</p>
      </div>
      <AuthForm mode="sign-up" />
      <p className="text-sm text-body">
        Already have an account? <Link href="/sign-in" className="font-semibold text-action">Sign in</Link>
      </p>
    </main>
  );
}
