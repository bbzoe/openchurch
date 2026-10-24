import Image from "next/image";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-8 p-6 md:p-10">
        <Image src="/lockup.svg" alt="OpenChurch" width={180} height={28} className="h-7 w-auto" style={{ width: "auto" }} priority />
        <div className="flex flex-1 items-center justify-center">
          <ForgotPasswordForm />
        </div>
      </div>
      <div className="relative hidden bg-forest lg:block">
        <Image src="/auth/fern.jpg" alt="A green fern frond" fill sizes="50vw" className="object-cover" />
      </div>
    </div>
  );
}
