import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CardSchema, ExplainRequest } from "@/lib/schema";
import { CARD_SYSTEM, cardUserPrompt } from "@/lib/prompts";
import { MODELS, jsonError, streamLens } from "@/lib/server/claude";
import { rateLimit } from "@/lib/server/ratelimit";
import { keyFromRequest } from "@/lib/server/byok";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { apiKey, error } = keyFromRequest(req);
  if (error) return jsonError(error, 400, "bad-key");
  // Visitors on their own key pay for their own usage, so they get a looser limit.
  if (!rateLimit(req, apiKey ? "explain-byok" : "explain", apiKey ? 200 : 25)) {
    return jsonError("You've hit the demo limit for explanations this hour. Try an example card instead.", 429, "limit");
  }

  const parsed = ExplainRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.", 400, "bad");

  return streamLens({
    apiKey,
    model: MODELS.card,
    system: CARD_SYSTEM,
    user: cardUserPrompt(parsed.data),
    maxTokens: 16000,
    // Measured: low streams first text in ~3s (medium: ~19s) with no accuracy loss on test concepts.
    effort: "low",
    format: zodOutputFormat(CardSchema),
  });
}
