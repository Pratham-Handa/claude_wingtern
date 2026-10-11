import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CardSchema, ExplainRequest } from "@/lib/schema";
import { CARD_SYSTEM, cardUserPrompt } from "@/lib/prompts";
import { MODELS, jsonError, streamLens } from "@/lib/server/claude";
import { rateLimit } from "@/lib/server/ratelimit";
import { keyFromRequest } from "@/lib/server/byok";
import { SESSION_COOKIE, sessionPasswordId } from "@/lib/server/auth";
import { quotaStoreConfigured, takeQuestion } from "@/lib/server/quota";
import { cookies } from "next/headers";

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

  // Password visitors get a question quota, so a shared password can't drain the owner's credits.
  // Visitors on their own key are not counted. Checked after validation so bad requests cost nothing.
  if (!apiKey) {
    const pid = sessionPasswordId((await cookies()).get(SESSION_COOKIE)?.value);
    if (pid) {
      if (!quotaStoreConfigured()) return jsonError("Question limits aren't set up on this deployment yet.", 503, "quota-setup");
      if (!(await takeQuestion(pid))) {
        return jsonError("This access password has used its question. Add your own Anthropic API key to keep going.", 403, "quota");
      }
    }
  }

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
