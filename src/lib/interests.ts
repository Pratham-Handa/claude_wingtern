export type InterestId = "cricket" | "f1" | "football" | "gaming" | "other";

export interface Interest {
  id: InterestId;
  label: string;
  glyph: string;
  /** DESIGN.md §2.4 category accent */
  accent: string;
  starters: string[];
}

export const INTERESTS: Interest[] = [
  {
    id: "cricket",
    label: "Cricket",
    glyph: "🏏",
    accent: "#5bb49c",
    starters: [
      "How does binary search work?",
      "What is conditional probability?",
      "What is a moving average?",
    ],
  },
  {
    id: "f1",
    label: "Formula 1",
    glyph: "🏎️",
    accent: "#f58b68",
    starters: [
      "What is concurrency in programming?",
      "How does compound interest work?",
      "What is a cache and why is it fast?",
    ],
  },
  {
    id: "football",
    label: "Football",
    glyph: "⚽",
    accent: "#669bc5",
    starters: [
      "What is a graph in computer science?",
      "What is opportunity cost?",
      "How does diversification reduce risk?",
    ],
  },
  {
    id: "gaming",
    label: "Gaming",
    glyph: "🎮",
    accent: "#9376d5",
    starters: [
      "What is recursion?",
      "How does inflation work?",
      "What is an API?",
    ],
  },
];

export const OTHER_ACCENT = "#e5ad53";

export function interestById(id: string): Interest | undefined {
  return INTERESTS.find((i) => i.id === id);
}

/** Accent for a card's chosen interest; custom interests fall back to gold. */
export function accentFor(id: string): string {
  return interestById(id)?.accent ?? OTHER_ACCENT;
}

export function labelFor(id: string, custom?: string): string {
  return interestById(id)?.label ?? custom ?? "Your interest";
}
