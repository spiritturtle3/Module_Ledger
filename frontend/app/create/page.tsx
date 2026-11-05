import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CreationForm } from "@/components/create/creation-form";
import { Container } from "@/components/ui/container";

export default function CreatePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card/40">
          <Container className="pb-10 pt-32 sm:pb-14 sm:pt-36">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Create something lasting</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Bring your idea<br /><span className="text-primary">on-chain.</span></h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">Shape the details of your next digital collectible. This demo helps you prepare a draft before storage and minting are connected.</p>
          </Container>
        </section>
        <Container className="py-12 sm:py-16"><CreationForm /></Container>
      </main>
      <Footer />
    </div>
  );
}
