import Image from "next/image";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 overflow-x-hidden">
      {/* Background image — same style as the public landing page */}
      <div
        className="fixed inset-0 bg-cover bg-[position:center_85%] bg-no-repeat z-0"
        style={{ backgroundImage: "url('/seleccion_espanola.jpg')" }}
      />
      {/* Dark overlay — fixed black so it works in both light and dark mode */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/80 z-0" />

      <div className="relative z-10 w-full max-w-md">
        {/* Glass panel — forced dark so all child theme tokens are light-colored */}
        <div className="dark rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl p-6 space-y-6 [&_label]:text-gray-100 [&_.text-muted-foreground]:!text-gray-400 [&_a.text-muted-foreground]:!text-gray-400 [&_input]:text-white [&_input]:border-white/20 [&_input]:placeholder:text-gray-500">

          {/* Logo + title */}
          <div className="flex flex-col items-center gap-3 text-center pb-2 select-none">
            <Link href="/">
              <Image
                src="/logo_0-0nobg.png"
                alt="Cero a Cero"
                width={160}
                height={48}
                priority
                className="h-12 w-auto"
              />
            </Link>
            <div className="space-y-1">
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: "#ffffff", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
              >
                {title}
              </h1>
              {description && (
                <p className="text-xs" style={{ color: "#cccccc" }}>
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {children}
          </div>

          {footer && (
            <div className="flex justify-center border-t border-white/10 pt-4 text-xs" style={{ color: "#cccccc" }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
