import Image from "next/image";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function SignInPage() {
  return (
    <main className="mx-auto grid min-h-full max-w-md gap-6 px-6 py-16">
      <Image src="/lockup.svg" alt="OpenChurch" width={220} height={34} className="h-8 w-auto" priority />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-body">Plan the service. Follow the same moment.</p>
      </div>
      <AuthForm mode="sign-in" />
      <p className="text-sm text-body">
        New here? <Link href="/sign-up" className="font-semibold text-action">Create an account</Link>
      </p>
    </main>
  );
}
