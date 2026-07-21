import type { Metadata } from "next";
import { KlarimbaLogo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Klarimba Enterprise",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; expired?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, expired } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--secondary),transparent)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <KlarimbaLogo className="size-14 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Klarimba Enterprise
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Consola de administración para empresas y partners
            </p>
          </div>
        </div>
        <LoginForm next={next} sessionExpired={expired === "1"} />
      </div>
    </main>
  );
}
