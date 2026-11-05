import { Container } from "@/components/ui/container";

const steps = [
  { number: "01", title: "Connect your wallet", text: "Bring your digital identity. No accounts to create, no passwords to remember." },
  { number: "02", title: "Find your next piece", text: "Explore a living catalog of art, objects, and ideas from independent creators." },
  { number: "03", title: "Make it yours", text: "Collect with confidence and keep a verifiable record of what you own." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary">Simple by design</p>
            <h2 className="max-w-sm text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Your collection starts here.</h2>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">The blockchain can be complex. Owning something special shouldn&apos;t be.</p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {steps.map((step) => (
              <div key={step.number} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr] sm:gap-7">
                <span className="font-mono text-xs text-primary">{step.number}</span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
