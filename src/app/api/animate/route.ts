import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CardSchema, SceneScriptSchema } from "@/lib/schema";
import { CINEMATIC_SYSTEM, SCENE_SYSTEM } from "@/lib/prompts";
import { MODELS, jsonError, streamLens } from "@/lib/server/claude";
import { rateLimit } from "@/lib/server/ratelimit";
import { keyFromRequest } from "@/lib/server/byok";

// Hobby + Fluid compute allows up to 300s; cinematic clips can take 30-90s.
export const maxDuration = 300;

const AnimateRequest = z.object({
  tier: z.union([z.literal(1), z.literal(2)]),
  accent: z.string().max(20),
  card: CardSchema,
});

export async function POST(req: Request) {
  const { apiKey, error } = keyFromRequest(req);
  if (error) return jsonError(error, 400, "bad-key");
  const parsed = AnimateRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.", 400, "bad");
  const { tier, accent, card } = parsed.data;

  const byok = !!apiKey;
  if (!rateLimit(req, `animate${tier}${byok ? "-byok" : ""}`, tier === 1 ? (byok ? 60 : 15) : byok ? 12 : 4)) {
    return jsonError("Animation limit reached for this hour.", 429, "limit");
  }

  const brief = JSON.stringify({
    concept: card.concept_title,
    concept_explanation: card.concept_explanation,
    interest: card.chosen_interest,
    interest_accent_colour: accent,
    analogy: card.analogy_title,
    narrative: card.analogy_narrative,
    mapping: card.mapping,
    worked_example: card.worked_example,
  });

  if (tier === 1) {
    return streamLens({
      apiKey,
      model: MODELS.scene,
      system: SCENE_SYSTEM,
      user: `Make the scene script for this learning card:\n${brief}`,
      maxTokens: 16000,
      effort: "low",
      format: zodOutputFormat(SceneScriptSchema),
    });
  }

  return streamLens({
    apiKey,
    model: MODELS.cinematic,
    system: CINEMATIC_SYSTEM,
    user: `Create the animated explainer for this learning card:\n${brief}`,
    maxTokens: 48000,
    // Measured on one card: high took 271s (too close to Hobby's 300s cap); medium took 184s with the same quality.
    effort: "medium",
    deadlineMs: 285_000,
  });
}
