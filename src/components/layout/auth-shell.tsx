import type { ReactNode } from "react";
import { KlarimbaLogo } from "@/components/brand/logo";

interface AuthShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
}

/** Marco de las páginas sin sesión: login, activación de cuenta y restablecer contraseña. */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--secondary),transparent)] p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <KlarimbaLogo className="size-14 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
