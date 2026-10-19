import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthMe } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { previewInvitation } from "@/lib/api/organizations";
import type { AuthMe, InvitationPreview } from "@/lib/api/schemas";
import { getSession } from "@/lib/session.server";
import { AcceptInvitation } from "./accept-invitation";
import { ActivateAccountForm } from "./activate-account-form";

export const metadata: Metadata = {
  title: "Activar cuenta · Klarimba Enterprise",
  robots: { index: false },
};

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

/** null si el código no existe; un mensaje si el API no deja consultarlo ahora. */
async function loadPreview(
  code: string,
): Promise<{ preview: InvitationPreview | null } | { error: string }> {
  try {
    return { preview: await previewInvitation(code) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return { preview: null };
    if (error instanceof ApiError && error.status === 429) {
      return { error: "Demasiadas consultas seguidas. Espera un minuto y recarga la página." };
    }
    throw error;
  }
}

/** Usuario de la sesión abierta, o null si no hay sesión (o ya no es válida). */
async function loadCurrentUser(): Promise<AuthMe | null> {
  const session = await getSession();
  if (!session.accessToken) return null;
  try {
    return await getAuthMe();
  } catch {
    return null;
  }
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 text-sm leading-relaxed">
        {children}
        <Button asChild variant="outline">
          <Link href="/login">Ir a iniciar sesión</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Destino del botón "Activar mi cuenta" del correo de invitación a
 * administradores. Sin sesión: crea la cuenta (nombre y contraseña) y entra.
 * Con sesión: acepta la invitación con esa cuenta.
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const loaded = await loadPreview(code);

  if ("error" in loaded) {
    return (
      <AuthShell title="Activa tu cuenta" description="Klarimba Enterprise">
        <Notice>
          <p>{loaded.error}</p>
        </Notice>
      </AuthShell>
    );
  }

  const { preview } = loaded;

  if (!preview) {
    return (
      <AuthShell title="Invitación no encontrada" description="Klarimba Enterprise">
        <Notice>
          <p>
            No encontramos esta invitación. Revisa que el enlace esté completo o
            pide una nueva a quien te invitó.
          </p>
        </Notice>
      </AuthShell>
    );
  }

  const description = (
    <>
      Te invitaron a administrar{" "}
      <strong className="font-semibold text-foreground">{preview.organizationName}</strong>
    </>
  );

  if (!preview.isRedeemable) {
    return (
      <AuthShell title="Invitación no disponible" description={description}>
        <Notice>
          <p>
            Esta invitación ya se usó, se revocó o venció. Si ya activaste tu
            cuenta, inicia sesión con tu correo. Si no, pide una invitación nueva
            a quien te invitó.
          </p>
        </Notice>
      </AuthShell>
    );
  }

  if (preview.roleToGrant === "MEMBER") {
    return (
      <AuthShell title="Invitación a la app" description={preview.organizationName}>
        <Notice>
          <p>
            Esta invitación es para usar la app de Klarimba, no el panel de
            administración. Descarga la app y usa este código al registrarte:
          </p>
          <p className="text-center font-mono text-lg font-bold tracking-widest text-primary">
            {code}
          </p>
        </Notice>
      </AuthShell>
    );
  }

  if (preview.identifierType === "PHONE") {
    return (
      <AuthShell title="Activa tu cuenta" description={description}>
        <Notice>
          <p>
            Esta invitación está asociada a un número de teléfono. Actívala desde
            la app de Klarimba con el código <strong className="font-mono">{code}</strong>.
          </p>
        </Notice>
      </AuthShell>
    );
  }

  const invitedEmail = preview.identifierType === "EMAIL" ? preview.identifier : null;
  const currentUser = await loadCurrentUser();

  return (
    <AuthShell title="Activa tu cuenta" description={description}>
      {currentUser ? (
        <AcceptInvitation
          code={code}
          currentEmail={currentUser.email ?? null}
          invitedEmail={invitedEmail}
        />
      ) : (
        <ActivateAccountForm
          code={code}
          email={invitedEmail}
          // Sin el campo (API sin desplegar) se piden: es lo que exige el API viejo.
          needsAppProfile={preview.grantsAppAccess !== false}
        />
      )}
    </AuthShell>
  );
}
