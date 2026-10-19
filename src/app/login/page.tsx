import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Klarimba Enterprise",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; expired?: string; reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, expired, reset } = await searchParams;

  return (
    <AuthShell
      title="Klarimba Enterprise"
      description="Consola de administración para empresas y partners"
    >
      <LoginForm
        next={next}
        sessionExpired={expired === "1"}
        passwordReset={reset === "1"}
      />
    </AuthShell>
  );
}
