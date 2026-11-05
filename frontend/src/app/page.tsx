import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  BrainCircuit,
  Database,
  FileUp,
  Fingerprint,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { LocalValidatorBadge } from "@/components/local-validator-badge";

const steps = [
  {
    icon: FileUp,
    number: "01",
    title: "Package your model",
    description:
      "Upload a versioned ZIP with its weights, config, and the details that help others understand what it does.",
  },
  {
    icon: Fingerprint,
    number: "02",
    title: "Create its record",
    description:
      "Keep the model package, cover image, and marketplace metadata linked by their own IPFS identifiers.",
  },
  {
    icon: Boxes,
    number: "03",
    title: "Make it discoverable",
    description:
      "Prepare an on-chain asset for a verified collection and a transparent marketplace listing.",
  },
];

const reasons = [
  {
    icon: ShieldIcon,
    title: "Verifiable ownership",
    text: "A clear record for model metadata and ownership, with marketplace actions designed to be transparent.",
  },
  {
    icon: BrainCircuit,
    title: "Built for AI creators",
    text: "Framework, task, version, and license information travel with every model package.",
  },
  {
    icon: Database,
    title: "Content stays addressable",
    text: "Model files, imagery, and manifests are uploaded through the ModuLedger backend to IPFS.",
  },
];

function ShieldIcon({ size = 24 }: { size?: number }) {
  return <Fingerprint size={size} />;
}

export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-orb orb-one" />
        <div className="hero-orb orb-two" />
        <div className="hero-content">
          <div className="hero-kicker">
            <Sparkles size={14} /> THE AI MODEL MARKETPLACE
          </div>
          <h1>
            Make intelligence <span>ownable.</span>
          </h1>
          <p className="hero-copy">
            Discover, publish, and trade AI models with provenance you can verify and ownership that
            stays yours.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/publish">
              Publish a model <ArrowRight size={17} />
            </Link>
            <Link className="button button-quiet" href="/marketplace">
              Explore marketplace <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-status">
            <LocalValidatorBadge />
            <span>Solana local network</span>
          </div>
          <div className="hero-floater float-card-left">
            <span className="float-glyph">⌘</span>
            <div>
              <b>Model provenance</b>
              <small>Metadata ready for IPFS</small>
            </div>
            <span className="float-dot" />
          </div>
          <div className="hero-floater float-card-right">
            <span className="float-glyph purple">◎</span>
            <div>
              <b>Solana powered</b>
              <small>Wallet connected assets</small>
            </div>
          </div>
        </div>
        <a className="scroll-cue" href="#how-it-works">
          <span /> Scroll to explore
        </a>
      </section>

      <section className="section-wrap" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">A simpler path from model to market</span>
          <h2>
            From model files to <span>model ownership.</span>
          </h2>
          <p>Package, describe, and prepare your AI work for a verifiable future.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ icon: Icon, number, title, description }) => (
            <article className="step-card" key={number}>
              <div className="step-top">
                <span className="step-number">{number}</span>
                <span className="icon-tile">
                  <Icon size={21} />
                </span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
              <span className="step-line" />
            </article>
          ))}
        </div>
      </section>

      <section className="ownership-section">
        <div className="ownership-glow" />
        <div className="section-wrap ownership-inner">
          <div>
            <span className="eyebrow">Models deserve better infrastructure</span>
            <h2>
              Built around the work.
              <br />
              <span>Designed for ownership.</span>
            </h2>
            <p>
              ModuLedger brings model files and their context into one discoverable place, with a
              dark, focused workspace made for creators and builders.
            </p>
            <Link className="text-link" href="/publish">
              Start with your model <ArrowRight size={16} />
            </Link>
          </div>
          <div className="orbit-visual" aria-hidden="true">
            <div className="orbit orbit-outer">
              <i />
            </div>
            <div className="orbit orbit-inner">
              <i />
            </div>
            <div className="orbit-core">
              <span>ML</span>
            </div>
            <span className="orbit-label label-model">MODEL</span>
            <span className="orbit-label label-chain">ON-CHAIN</span>
            <span className="orbit-label label-data">METADATA</span>
          </div>
        </div>
      </section>

      <section className="section-wrap why-section">
        <div className="section-heading">
          <span className="eyebrow">Why ModuLedger</span>
          <h2>
            Your model. Its story. <span>One place.</span>
          </h2>
        </div>
        <div className="reason-grid">
          {reasons.map(({ icon: Icon, title, text }) => (
            <article className="reason-card" key={title}>
              <span className="icon-tile">
                <Icon size={21} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div className="cta-glow" />
        <span className="eyebrow">Start building</span>
        <h2>Bring your model to ModuLedger.</h2>
        <p>Prepare your package and metadata through the creator workspace.</p>
        <Link className="button button-primary" href="/publish">
          Create model record <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
