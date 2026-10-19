"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { acceptInvitationAction, switchAccountAction } from "./actions";

interface AcceptInvitationProps {
  code: string;
  /** Correo de la sesión abierta. */
  currentEmail: string | null;
  /** Correo al que está atada la invitación, si lo está. */
  invitedEmail: string | null;
}

/** Con sesión abierta no hace falta crear cuenta: basta con canjear el código. */
export function AcceptInvitation({ code, currentEmail, invitedEmail }: AcceptInvitationProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, startAccept] = useTransition();
  const [isSwitching, startSwitch] = useTransition();
  const otherAccount =
    Boolean(invitedEmail && currentEmail) &&
    invitedEmail!.toLowerCase() !== currentEmail!.toLowerCase();

  function accept() {
    setError(null);
    startAccept(async () => {
      // Si sale bien, la acción redirige a la organización.
      const result = await acceptInvitationAction(code);
      if (result && !result.ok) setError(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <p className="text-sm">
          Tienes la sesión abierta como{" "}
          <strong className="font-semibold">{currentEmail ?? "usuario sin correo"}</strong>.
        </p>
        {otherAccount && (
          <Alert>
            <AlertDescription>
              Esta invitación es para <strong className="font-semibold">{invitedEmail}</strong>.
              Cierra la sesión para activarla con ese correo.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!otherAccount && (
          <Button size="lg" onClick={accept} disabled={isAccepting}>
            {isAccepting && <Loader2 className="animate-spin" />}
            Aceptar invitación
          </Button>
        )}
        <Button
          variant={otherAccount ? "default" : "ghost"}
          size={otherAccount ? "lg" : "sm"}
          disabled={isSwitching}
          onClick={() => startSwitch(() => switchAccountAction(code))}
        >
          {isSwitching && <Loader2 className="animate-spin" />}
          {otherAccount ? "Cerrar sesión y continuar" : "No soy yo: cerrar sesión"}
        </Button>
      </CardContent>
    </Card>
  );
}
