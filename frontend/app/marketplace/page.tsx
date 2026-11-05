import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export default function MarketplacePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <MarketplaceBrowser />
      <Footer />
    </div>
  );
}
