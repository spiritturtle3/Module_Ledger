import { Container } from "@/components/ui/container";

const features = [
  { number: "01", title: "Create with intention", text: "Turn your ideas into on-chain assets with a simple, creator-first experience.", icon: "✦" },
  { number: "02", title: "Discover the unexpected", text: "Find work from independent artists and collect pieces that feel like you.", icon: "◌" },
  { number: "03", title: "Trade with clarity", text: "Clear pricing, verified collections, and a marketplace built around trust.", icon: "↗" },
];

export function Features() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">A better marketplace</p>
            <h2 className="max-w-lg text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">The tools to collect<br />what matters.</h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">Everything you need to participate in the digital economy, thoughtfully brought together.</p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.number} className="group bg-card p-7 transition-colors hover:bg-accent/50 sm:p-9">
              <div className="flex items-start justify-between">
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-xl text-accent-foreground">{feature.icon}</span>
                <span className="font-mono text-xs text-muted-foreground">{feature.number}</span>
              </div>
              <h3 className="mt-16 text-lg font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.text}</p>
              <span className="mt-8 block text-sm text-primary transition-transform group-hover:translate-x-1">Learn more <span className="ml-1">→</span></span>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
