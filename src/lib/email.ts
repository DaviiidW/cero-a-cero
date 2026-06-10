import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail =
  process.env.EMAIL_FROM ?? "Cero a Cero <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.info("[dev] Enlace de recuperación de contraseña:", resetUrl);
      return;
    }

    throw new Error("RESEND_API_KEY no está configurada");
  }

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Recupera tu contraseña — Cero a Cero",
    html: `
      <p>Hola,</p>
      <p>Has solicitado restablecer tu contraseña en Cero a Cero.</p>
      <p><a href="${resetUrl}">Establecer nueva contraseña</a></p>
      <p>Este enlace expira en 1 hora y solo puede usarse una vez.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `,
  });
}
