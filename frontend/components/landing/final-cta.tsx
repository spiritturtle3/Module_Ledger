import { Container } from "@/components/ui/container";

export function FinalCta() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-foreground px-7 py-16 text-center text-background sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute -left-10 -top-20 size-64 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-12 size-72 rounded-full bg-[#e9ad8e]/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/60">Start collecting</p>
            <h2 className="mx-auto mt-5 max-w-xl text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">There&apos;s a world of work waiting for you.</h2>
            <a href="#collections" className="mt-8 inline-flex rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5">Explore the marketplace <span className="ml-3">↗</span></a>
          </div>
        </div>
      </Container>
    </section>
  );
}
