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
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 overflow-x-hidden">
      {/* Fixed background image viewport-locked to look perfect on mobile and prevent stretching */}
      <div 
        className="fixed inset-0 bg-cover bg-[position:center_75%] bg-no-repeat z-0"
        style={{ backgroundImage: "url('/seleccion_espanola.jpg')" }}
      />
      {/* Semi-transparent dark overlay with even lower opacity (35%) to make the background image more visible */}
      <div className="fixed inset-0 bg-background/35 backdrop-blur-[1px] z-0" />

      <Card className="relative z-10 w-full max-w-md border-border/60 shadow-2xl bg-card/90 backdrop-blur-md">
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
