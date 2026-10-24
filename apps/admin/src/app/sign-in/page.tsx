import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <Image src="/lockup.svg" alt="OpenChurch" width={180} height={28} className="h-7 w-auto" style={{ width: "auto" }} priority />
        <div className="flex flex-1 items-center justify-center">
          <LoginForm />
        </div>
      </div>
      <div className="relative hidden bg-forest lg:block">
        <Image src="/auth/fern.jpg" alt="A green fern frond" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest/80 via-forest/10 to-transparent" />
      </div>
    </div>
  );
}
