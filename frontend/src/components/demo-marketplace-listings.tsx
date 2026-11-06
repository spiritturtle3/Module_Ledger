import { BrainCircuit, Eye, ImageIcon, LockKeyhole, ShieldAlert, Sparkles } from "lucide-react";

const examples = [
  {
    id: "image-classifier",
    title: "VisionTag Image Classifier",
    summary: "An illustrative computer-vision model for sorting images into labeled categories.",
    category: "Computer vision",
    framework: "PyTorch",
    version: "v1.0.0",
    price: "0.25",
    icon: ImageIcon,
    theme: "vision",
  },
  {
    id: "sentiment-analyzer",
    title: "SentimentForge Text Analyzer",
    summary: "An illustrative language model for detecting positive, negative, and neutral sentiment.",
    category: "Natural language",
    framework: "Transformers",
    version: "v1.2.0",
    price: "0.65",
    icon: BrainCircuit,
    theme: "language",
  },
] as const;

/**
 * Design-only demo data. Never passed into fetchActiveListings, purchaseListing,
 * listVerifiedNft, or wallet transaction functions. Not verified on-chain.
 */
export function DemoMarketplaceListings() {
  return (
    <section className="ml-demo-market" aria-label="Demo models, not on-chain listings">
      <div className="ml-demo-market__heading">
        <div>
          <span className="eyebrow">EXPLORE THE EXPERIENCE</span>
          <h2>Featured model previews</h2>
          <p>Two sample models to demonstrate how the catalog will look when creators publish verified listings.</p>
        </div>
        <span className="ml-demo-market__pill"><Eye size={15} aria-hidden="true" /> Demo previews only</span>
      </div>
      <div className="ml-demo-market__grid">
        {examples.map((model) => {
          const Icon = model.icon;
          return (
            <article key={model.id} className={`ml-demo-model ml-demo-model--${model.theme}`}>
              <div className="ml-demo-model__art" aria-hidden="true">
                <div className="ml-demo-model__orb"><Icon size={38} strokeWidth={1.5} /></div>
                <div className="ml-demo-model__art-caption"><Sparkles size={13} /> Model preview</div>
              </div>
              <div className="ml-demo-model__body">
                <div className="ml-demo-model__labels">
                  <span>{model.category}</span>
                  <span className="ml-demo-model__sample"><ShieldAlert size={13} aria-hidden="true" /> Sample · not verified</span>
                </div>
                <h3>{model.title}</h3>
                <p>{model.summary}</p>
                <div className="ml-demo-model__meta"><span>{model.framework}</span><span>{model.version}</span></div>
                <div className="ml-demo-model__footer">
                  <div><small>Illustrative price</small><strong>{model.price} <span>Devnet SOL</span></strong></div>
                  <span className="ml-demo-model__disabled" aria-label="Preview only; not available to purchase">
                    <LockKeyhole size={15} aria-hidden="true" /> Preview only
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="ml-demo-market__disclaimer">
        These cards are sample content only: there are no mint addresses, approved collections, sellers, escrowed NFTs, or purchase transactions behind them. Real, on-chain Devnet listings appear below.
      </p>
    </section>
  );
}
