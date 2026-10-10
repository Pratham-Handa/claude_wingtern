import type { Card, SceneScript } from "@/lib/schema";
import binarySearch from "./binary-search-cricket.json";
import compound from "./compound-interest-gaming.json";
import diversification from "./diversification-football.json";
import binarySearchScene from "./binary-search-cricket.scene.json";
import compoundScene from "./compound-interest-gaming.scene.json";
import diversificationScene from "./diversification-football.scene.json";
import conditional from "./conditional-probability-cricket.json";
import conditionalScene from "./conditional-probability-cricket.scene.json";

export interface Showcase {
  id: string;
  question: string;
  domain: string;
  card: Card;
  scene: SceneScript;
  /** Pre-generated Tier 2 clip in /public/showcase, if one exists */
  cinematic?: string;
}

/** Hand-checked example cards: instant, free and safe for live demos (PRD §9). */
export const SHOWCASES: Showcase[] = [
  {
    id: "binary-search-cricket",
    question: "How does binary search work?",
    domain: "Computer science",
    card: binarySearch as Card,
    scene: binarySearchScene as unknown as SceneScript,
    cinematic: "/showcase/binary-search-cricket.html",
  },
  {
    // Real Opus 5.5 output (card, scene script and cinematic), saved unedited from a live run.
    id: "conditional-probability-cricket",
    question: "What is conditional probability?",
    domain: "Maths · made live by Opus",
    card: conditional as Card,
    scene: conditionalScene as unknown as SceneScript,
    cinematic: "/showcase/conditional-probability-cricket.html",
  },
  {
    id: "compound-interest-gaming",
    question: "How does compound interest work?",
    domain: "Finance",
    card: compound as Card,
    scene: compoundScene as unknown as SceneScript,
  },
  {
    id: "diversification-football",
    question: "How does diversification reduce risk?",
    domain: "Investing",
    card: diversification as Card,
    scene: diversificationScene as unknown as SceneScript,
  },
];

export function findShowcase(card: Card): Showcase | undefined {
  return SHOWCASES.find((s) => s.card.concept_title === card.concept_title && s.card.chosen_interest === card.chosen_interest);
}
