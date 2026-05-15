import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:py-20">
        <div className="w-full max-w-md sm:max-w-lg flex flex-col items-center text-center gap-6">
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Coming soon
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
            dirtydoor<span className="text-muted-foreground">.com</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground text-balance">
            A home for the world&apos;s grimiest, grimmest, most regrettable doors.
            Snap them. Share them. Judge them.
          </p>
          <Button size="lg" className="mt-2 w-full sm:w-auto">
            Post a door
          </Button>
        </div>
      </section>
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Built with Next.js, Drizzle, Tailwind, and shadcn/ui.
      </footer>
    </main>
  );
}
