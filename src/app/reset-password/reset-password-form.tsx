"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  forgotPasswordInputSchema,
  resetPasswordInputSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/api/schemas";
import { requestPasswordResetAction, resetPasswordAction } from "./actions";

/**
 * Dos pasos: el correo (el API manda un código de 6 dígitos) y luego el código
 * con la contraseña nueva. El paso 1 no revela si la cuenta existe.
 */
export function ResetPasswordForm() {
  const [email, setEmail] = useState<string | null>(null);

  return (
    <Card>
      <CardContent className="pt-6">
        {email ? (
          <NewPasswordStep email={email} onChangeEmail={() => setEmail(null)} />
        ) : (
          <EmailStep onSent={setEmail} />
        )}
        <p className="mt-5 text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordInputSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(values);
      if (result.ok) onSent(values.email.trim());
      else setServerError(result.error);
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-email">Correo electrónico</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Enviar código
      </Button>
    </form>
  );
}

function NewPasswordStep({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordInputSchema),
    defaultValues: { email, code: "", password: "", passwordConfirmation: "" },
  });
  const { errors } = form.formState;

  function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      // Si sale bien, la acción redirige al login con el aviso de éxito.
      const result = await resetPasswordAction(values);
      if (result && !result.ok) setServerError(result.error);
    });
  }

  function resend() {
    startResend(async () => {
      const result = await requestPasswordResetAction({ email });
      if (result.ok) toast.success("Te enviamos un código nuevo");
      else toast.error(result.error);
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <Alert>
        <AlertDescription>
          Si <strong className="font-semibold">{email}</strong> tiene una cuenta,
          le enviamos un código de 6 dígitos. Revisa también la carpeta de spam.
        </AlertDescription>
      </Alert>
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-code">Código</Label>
        <Input
          id="reset-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          aria-invalid={Boolean(errors.code)}
          {...form.register("code")}
        />
        {errors.code && (
          <p className="text-xs text-destructive">{errors.code.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password">Contraseña nueva</Label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          {...form.register("password")}
        />
        <p
          className={
            errors.password
              ? "text-xs text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {errors.password?.message ??
            "8 a 24 caracteres, con una mayúscula, un número y un símbolo."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reset-password-confirmation">Repite la contraseña</Label>
        <Input
          id="reset-password-confirmation"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.passwordConfirmation)}
          {...form.register("passwordConfirmation")}
        />
        {errors.passwordConfirmation && (
          <p className="text-xs text-destructive">
            {errors.passwordConfirmation.message}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Guardar contraseña
      </Button>
      <div className="flex justify-between gap-2 text-xs">
        <button
          type="button"
          onClick={onChangeEmail}
          className="font-medium text-muted-foreground hover:text-foreground"
        >
          Usar otro correo
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={isResending}
          className="font-medium text-primary hover:underline disabled:opacity-50"
        >
          {isResending ? "Enviando…" : "Reenviar código"}
        </button>
      </div>
    </form>
  );
}
