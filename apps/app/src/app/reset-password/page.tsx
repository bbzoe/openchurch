import { Suspense } from "react";
import { AuthCover } from "@/components/auth-cover";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCover>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCover>
  );
}
