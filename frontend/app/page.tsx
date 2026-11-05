import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Collections } from "@/components/landing/collections";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Collections />
        <HowItWorks />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
