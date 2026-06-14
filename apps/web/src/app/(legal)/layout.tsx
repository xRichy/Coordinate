import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-5 py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <article className="space-y-4 text-sm leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
          {children}
        </article>
      </div>
    </div>
  );
}
