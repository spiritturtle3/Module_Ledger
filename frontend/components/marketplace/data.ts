import type { CollectibleArtProps } from "@/components/landing/collectible-art";

export type MarketplaceCategory = "Art" | "Generative" | "Photography" | "Collectibles";

export type MarketplaceItem = {
  id: string;
  name: string;
  collection: string;
  creator: string;
  owner: string;
  price: number;
  category: MarketplaceCategory;
  description: string;
  edition: string;
  variant: NonNullable<CollectibleArtProps["variant"]>;
};

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: "quiet-forms-014",
    name: "Quiet Forms #014",
    collection: "The Quiet Forms",
    creator: "Mira Chen",
    owner: "Collection vault",
    price: 2.4,
    category: "Art",
    description: "A study in balance, negative space, and the soft geometry of a passing moment.",
    edition: "014 / 100",
    variant: "hero",
  },
  {
    id: "soft-horizons-021",
    name: "Soft Horizons #021",
    collection: "Soft Horizons",
    creator: "Mira Chen",
    owner: "Collection vault",
    price: 1.8,
    category: "Photography",
    description: "Warm light gathers at the edge of the day in this quiet digital study.",
    edition: "021 / 50",
    variant: "sunset",
  },
  {
    id: "orbital-drift-007",
    name: "Orbital Drift #007",
    collection: "Orbitals / 01",
    creator: "Studio Kinetic",
    owner: "Studio Kinetic",
    price: 3.42,
    category: "Generative",
    description: "A generative system built from simple paths, infinite motion, and a little tension.",
    edition: "007 / 250",
    variant: "orbit",
  },
  {
    id: "quiet-totems-003",
    name: "Quiet Totem #003",
    collection: "Quiet Totems",
    creator: "Niko Eames",
    owner: "Niko Eames",
    price: 0.95,
    category: "Collectibles",
    description: "An object for another time, rendered as a small digital monument.",
    edition: "003 / 25",
    variant: "totem",
  },
  {
    id: "quiet-forms-032",
    name: "Quiet Forms #032",
    collection: "The Quiet Forms",
    creator: "Mira Chen",
    owner: "Collection vault",
    price: 4.1,
    category: "Art",
    description: "A companion piece from the first study, composed for slower looking.",
    edition: "032 / 100",
    variant: "hero",
  },
  {
    id: "orbital-drift-044",
    name: "Orbital Drift #044",
    collection: "Orbitals / 01",
    creator: "Studio Kinetic",
    owner: "Collection vault",
    price: 2.75,
    category: "Generative",
    description: "A new arrangement from a living system of lines and luminous forms.",
    edition: "044 / 250",
    variant: "orbit",
  },
];

export const marketplaceCategories: Array<"All" | MarketplaceCategory> = [
  "All",
  "Art",
  "Generative",
  "Photography",
  "Collectibles",
];
