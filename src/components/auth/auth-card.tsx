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
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4 text-center">
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
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        {children}
        {footer ? <div className="text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
