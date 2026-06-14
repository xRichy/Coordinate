export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // min-h-dvh (not 100vh) so the layout fits the visible viewport on mobile
    // browsers (no content hidden behind the Safari toolbar). Scrolls if the
    // card is taller than the screen.
    <div className="relative min-h-dvh flex flex-col items-center justify-center p-4 py-10 bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md animate-in slide-up duration-700">
        {children}
      </div>
    </div>
  );
}
