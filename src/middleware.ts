export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/perfil", "/grupos/:path*", "/ranking"],
};
