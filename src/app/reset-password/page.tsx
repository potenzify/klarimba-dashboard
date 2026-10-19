import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña · Klarimba Enterprise",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Restablecer contraseña"
      description="Te enviaremos un código a tu correo para crear una contraseña nueva"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
