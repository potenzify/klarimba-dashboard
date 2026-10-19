"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  activateAccountInputSchema,
  type ActivateAccountInput,
} from "@/lib/api/schemas";
import { activateAccountAction } from "./actions";
import { EMAIL_TAKEN } from "./invite-errors";

const TERMS_URL = "https://klarimba.app/terminos";
const PRIVACY_URL = "https://klarimba.app/privacidad";

interface ActivateAccountFormProps {
  code: string;
  /** Correo al que está atada la invitación; null si hay que pedirlo. */
  email: string | null;
  /** La invitación también da acceso a la app: el API exige fecha de nacimiento y género. */
  needsAppProfile: boolean;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

export function ActivateAccountForm({
  code,
  email,
  needsAppProfile,
}: ActivateAccountFormProps) {
  const [serverError, setServerError] = useState<{ message: string; code?: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const schema = useMemo(
    () => activateAccountInputSchema({ needsEmail: !email, needsAppProfile }),
    [email, needsAppProfile],
  );
  const form = useForm<ActivateAccountInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: email ?? "",
      firstName: "",
      lastName: "",
      password: "",
      passwordConfirmation: "",
      acceptTerms: false,
    },
  });
  const gender = useWatch({ control: form.control, name: "gender" });
  const { errors } = form.formState;
  const loginHref = `/login?next=${encodeURIComponent(`/invite/${code}`)}`;

  function onSubmit(values: ActivateAccountInput) {
    setServerError(null);
    startTransition(async () => {
      // Si sale bien, la acción abre la sesión y redirige al dashboard.
      const result = await activateAccountAction(code, values);
      if (result && !result.ok) setServerError({ message: result.error, code: result.code });
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {serverError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {serverError.message}
              {serverError.code === EMAIL_TAKEN && (
                <>
                  {" "}
                  <Link href={loginHref} className="font-semibold underline">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="activate-email">Correo electrónico</Label>
            <Input
              id="activate-email"
              type="email"
              autoComplete="email"
              placeholder="tu@empresa.com"
              readOnly={Boolean(email)}
              className={email ? "bg-muted text-muted-foreground" : undefined}
              aria-invalid={Boolean(errors.email)}
              {...form.register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-first-name">Nombre</Label>
              <Input
                id="activate-first-name"
                autoComplete="given-name"
                aria-invalid={Boolean(errors.firstName)}
                {...form.register("firstName")}
              />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="activate-last-name">Apellido</Label>
              <Input
                id="activate-last-name"
                autoComplete="family-name"
                aria-invalid={Boolean(errors.lastName)}
                {...form.register("lastName")}
              />
              <FieldError message={errors.lastName?.message} />
            </div>
          </div>
          {needsAppProfile && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="activate-birth-date">Fecha de nacimiento</Label>
                <Input
                  id="activate-birth-date"
                  type="date"
                  autoComplete="bday"
                  aria-invalid={Boolean(errors.birthDate)}
                  {...form.register("birthDate")}
                />
                <FieldError message={errors.birthDate?.message} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Género</Label>
                <Select
                  value={gender}
                  onValueChange={(value) =>
                    form.setValue("gender", value as ActivateAccountInput["gender"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="w-full" aria-invalid={Boolean(errors.gender)}>
                    <SelectValue placeholder="Elige" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Femenino</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={errors.gender?.message} />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="activate-password">Contraseña</Label>
            <Input
              id="activate-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...form.register("password")}
            />
            <p
              className={
                errors.password ? "text-xs text-destructive" : "text-xs text-muted-foreground"
              }
            >
              {errors.password?.message ??
                "8 a 24 caracteres, con una mayúscula, un número y un símbolo."}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="activate-password-confirmation">Repite la contraseña</Label>
            <Input
              id="activate-password-confirmation"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.passwordConfirmation)}
              {...form.register("passwordConfirmation")}
            />
            <FieldError message={errors.passwordConfirmation?.message} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 size-4 shrink-0 accent-primary"
                aria-invalid={Boolean(errors.acceptTerms)}
                {...form.register("acceptTerms")}
              />
              <span>
                Acepto los{" "}
                <a
                  href={TERMS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  términos y condiciones
                </a>{" "}
                y la{" "}
                <a
                  href={PRIVACY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  política de privacidad
                </a>
                .
              </span>
            </label>
            <FieldError message={errors.acceptTerms?.message} />
          </div>
          <Button type="submit" size="lg" disabled={isPending} className="mt-1">
            {isPending && <Loader2 className="animate-spin" />}
            Activar mi cuenta
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          ¿Ya tienes una cuenta en Klarimba?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
