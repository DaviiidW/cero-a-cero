import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
