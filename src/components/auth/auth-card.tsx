import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardHeader className="flex flex-col items-center gap-4 text-center pb-4 select-none">
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
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
        {footer && (
          <CardFooter className="flex justify-center border-t border-border/40 pt-4 text-xs">
            {footer}
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
