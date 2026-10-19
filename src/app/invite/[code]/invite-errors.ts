/**
 * `code` del resultado de `activateAccountAction` cuando el correo ya tiene
 * cuenta: el formulario ofrece iniciar sesión. Vive fuera de `actions.ts`
 * porque un archivo `"use server"` solo puede exportar funciones async.
 */
export const EMAIL_TAKEN = "EMAIL_TAKEN";
