import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Comprobación rápida de existencia de cookies de sesión
  const hasSessionCookie = 
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("next-auth.session-token");

  if (!hasSessionCookie) {
    const callbackUrl = encodeURIComponent(req.nextUrl.href);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  // Verificación y decodificación del token JWT
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Forzamos la lectura de cookies seguras si estamos en HTTPS o producción
    secureCookie: req.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
  });

  if (!token) {
    const callbackUrl = encodeURIComponent(req.nextUrl.href);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/perfil", "/grupos/:path*", "/ranking"],
};

