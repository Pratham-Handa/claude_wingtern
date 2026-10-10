import { z } from "zod";

/* ---------- Learning card ---------- */

export const VisualType = z.enum([
  "flowchart",
  "graph",
  "sequence",
  "steps",
  "comparison",
  "none",
]);

export const StepSchema = z.object({
  label: z.string().describe("Short step title, e.g. 'Check the middle'"),
  items: z
    .array(z.string())
    .describe("Row of boxes showing the state at this step (e.g. array values, rankings, years). Max 10. Empty if not useful."),
  highlight: z.array(z.number()).describe("0-based indices of items to highlight (the focus of this step)"),
  dim: z.array(z.number()).describe("0-based indices of items that are discarded / out of play"),
  metric_label: z.string().describe("Optional running value label, e.g. 'Balance'. Empty string if unused."),
  metric_value: z.number().describe("Running numeric value at this step (e.g. balance). 0 if unused."),
  note: z.string().describe("One sentence explaining what changed"),
});

export const VisualSchema = z.object({
  type: VisualType,
  caption: z.string(),
  mermaid: z
    .string()
    .describe("Mermaid source for flowchart/graph/sequence. Empty string for other types."),
  steps: z.array(StepSchema).describe("Only for type 'steps'. Empty array otherwise."),
  comparison_columns: z.array(z.string()).describe("Only for type 'comparison': header row. Empty otherwise."),
  comparison_rows: z
    .array(z.array(z.string()))
    .describe("Only for type 'comparison': each row has the same length as comparison_columns."),
});

export const CardSchema = z.object({
  concept_title: z.string(),
  chosen_interest: z.string().describe("Interest id used: cricket | f1 | football | gaming | other"),
  interest_reason: z.string().describe("One line on why this interest fits the concept structurally"),
  concept_explanation: z.string().describe("2-4 plain sentences, no analogy. The accuracy anchor."),
  analogy_title: z.string(),
  analogy_narrative: z.string().describe("3-6 sentences telling the analogy as a concrete scene"),
  mapping: z
    .array(z.object({ concept: z.string(), analogy: z.string() }))
    .describe("3-6 rows mapping concept parts/operations to analogy parts/operations"),
  visual: VisualSchema,
  worked_example: z
    .array(z.object({ step: z.string(), concept_link: z.string() }))
    .describe("3-6 concrete steps; concept_link ties each back to the real concept"),
  analogy_limits: z.array(z.string()).describe("1-3 places where the analogy stops being accurate"),
  check_question: z.string(),
  check_options: z
    .array(z.object({ text: z.string(), correct: z.boolean(), why: z.string() }))
    .describe("Exactly 4 options, exactly one correct"),
  next_concept: z.string(),
  is_finance: z.boolean().describe("True if the topic is personal finance / investing"),
});

export type Card = z.infer<typeof CardSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Visual = z.infer<typeof VisualSchema>;

/* ---------- Animation scene script (Tier 1) ---------- */

export const ElementKind = z.enum(["box", "circle", "label", "arrow", "counter", "bar", "icon"]);
export const ColorName = z.enum(["ink", "orange", "teal", "gold", "accent", "muted"]);
export const IconName = z.enum([
  "ball", "bat", "car", "flag", "coin", "chart", "controller", "trophy",
  "person", "clock", "wrench", "stadium", "bank", "star",
]);

export const ElementSchema = z.object({
  id: z.string(),
  kind: ElementKind,
  x: z.number().describe("Centre x on a 0-100 grid (16:9 stage)"),
  y: z.number().describe("Centre y on a 0-100 grid"),
  w: z.number().describe("Width on the 0-100 grid (box/bar). 0 for default."),
  h: z.number().describe("Height on the 0-100 grid (box/bar max height). 0 for default."),
  text: z.string().describe("Label text inside / under the element. Keep to ~3 words."),
  color: ColorName,
  icon: IconName.describe("Only used when kind = icon; otherwise 'star'"),
  enter_at: z.number().describe("Seconds from scene start when it appears"),
  highlight_at: z.number().describe("Seconds from scene start to highlight it; -1 for never"),
  exit_at: z.number().describe("Seconds from scene start to fade it out; -1 for never"),
  move_at: z.number().describe("Seconds from scene start to move it; -1 for never"),
  move_to_x: z.number(),
  move_to_y: z.number(),
  from_id: z.string().describe("Arrow start element id; empty otherwise"),
  to_id: z.string().describe("Arrow end element id; empty otherwise"),
  value_from: z.number().describe("Counter/bar start value; 0 otherwise"),
  value_to: z.number().describe("Counter/bar end value; 0 otherwise"),
});

export const SceneSchema = z.object({
  title: z.string(),
  caption: z.string().describe("Narration shown under the stage, 1-2 short sentences"),
  duration: z.number().describe("Seconds, 4-9"),
  elements: z.array(ElementSchema).describe("2-12 elements"),
});

export const SceneScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(SceneSchema).describe("3-6 scenes telling the analogy, then connecting it to the real concept"),
});

export type SceneScript = z.infer<typeof SceneScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneElement = z.infer<typeof ElementSchema>;

/* ---------- Request ---------- */

export const Mode = z.enum(["default", "simpler", "another_analogy", "deeper", "switch_interest"]);
export type Mode = z.infer<typeof Mode>;

export const ExplainRequest = z.object({
  question: z.string().min(2).max(500),
  interests: z.array(z.string().max(40)).min(1).max(4),
  customInterest: z.string().max(60).optional(),
  mode: Mode.default("default"),
  previous: z
    .object({ chosen_interest: z.string(), analogy_title: z.string(), concept_title: z.string() })
    .optional(),
  targetInterest: z.string().max(60).optional(),
});
export type ExplainRequest = z.infer<typeof ExplainRequest>;
