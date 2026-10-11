import Anthropic from "@anthropic-ai/sdk";

/** One place to switch models (PRD §8.2 latency escape hatch). */
export const MODELS = {
  card: process.env.LENS_CARD_MODEL ?? "claude-opus-5-5",
  scene: process.env.LENS_SCENE_MODEL ?? "claude-opus-5-5",
  cinematic: process.env.LENS_CINEMATIC_MODEL ?? "claude-opus-5-5",
  repair: "claude-haiku-5-5",
} as const;

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

let client: Anthropic | null = null;
/** The server's shared client, or a one-off client for a visitor's own key (never cached). */
export function claude(apiKey?: string): Anthropic {
  if (apiKey) return new Anthropic({ apiKey });
  client ??= new Anthropic();
  return client;
}

/** Events sent to the browser as NDJSON lines. */
export type LensEvent =
  | { t: "think"; v: string } // summarized thinking delta (status line)
  | { t: "d"; v: string } // output text delta
  | { t: "reset" } // a fallback model took over; discard text so far
  | { t: "done"; stop: string | null }
  | { t: "error"; message: string; code?: string };

interface StreamArgs {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  effort: Effort;
  /** JSON-schema output format, e.g. from zodOutputFormat() */
  format?: unknown;
  /** Abort and report a clear error before the platform's function limit kills the stream. */
  deadlineMs?: number;
  /** The visitor's own key (bring-your-own-key). Omit to use the server's key. */
  apiKey?: string;
}

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/**
 * Streams a Claude response as NDJSON LensEvents. Uses server-side refusal
 * fallbacks when available and retries once without them if the API rejects
 * the parameter.
 */
export function streamLens(args: StreamArgs): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: LensEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      // Keep the connection visibly alive while the model thinks.
      const ping = setInterval(() => send({ t: "think", v: "" }), 8000);
      const abort = new AbortController();
      const deadline = args.deadlineMs ? setTimeout(() => abort.abort(), args.deadlineMs) : null;

      const run = async (withFallbacks: boolean) => {
        const params = {
          model: args.model,
          max_tokens: args.maxTokens,
          thinking: { type: "adaptive", display: "summarized" },
          output_config: { effort: args.effort, ...(args.format ? { format: args.format } : {}) },
          system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: args.user }],
          ...(withFallbacks ? { betas: [FALLBACK_BETA], fallbacks: "default" } : {}),
        };
        // The beta stream accepts `fallbacks`; cast because SDK typings may lag the API.
        const stream = claude(args.apiKey).beta.messages.stream(params as never, { signal: abort.signal });
        let sentText = false;
        for await (const ev of stream as AsyncIterable<Anthropic.Beta.BetaRawMessageStreamEvent>) {
          if (ev.type === "content_block_start") {
            const blockType = (ev.content_block as { type: string }).type;
            if (blockType === "fallback" && sentText) send({ t: "reset" });
          } else if (ev.type === "content_block_delta") {
            const d = ev.delta as { type: string; text?: string; thinking?: string };
            if (d.type === "text_delta" && d.text) {
              sentText = true;
              send({ t: "d", v: d.text });
            } else if (d.type === "thinking_delta" && d.thinking) {
              send({ t: "think", v: d.thinking });
            }
          }
        }
        const final = await stream.finalMessage();
        return final.stop_reason as string | null;
      };

      try {
        let stop: string | null;
        try {
          stop = await run(true);
        } catch (err) {
          if (err instanceof Anthropic.BadRequestError && /fallback|beta/i.test(err.message)) {
            stop = await run(false);
          } else {
            throw err;
          }
        }
        send({ t: "done", stop });
      } catch (err) {
        send(
          abort.signal.aborted
            ? { t: "error", code: "timeout", message: "This one took too long to generate. Try again, or use the explainer animation." }
            : toErrorEvent(err, !!args.apiKey),
        );
      } finally {
        clearInterval(ping);
        if (deadline) clearTimeout(deadline);
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function toErrorEvent(err: unknown, byok: boolean): LensEvent {
  if (err instanceof Anthropic.AuthenticationError) {
    return byok
      ? { t: "error", code: "auth", message: "Anthropic didn't accept your API key. Check it under Your API key." }
      : { t: "error", code: "auth", message: "The server's Anthropic API key is missing or invalid." };
  }
  if (byok && err instanceof Anthropic.NotFoundError) {
    return { t: "error", code: "model", message: `Your API key can't use the Claude models Lens needs (${MODELS.card}). Check your organisation's model access.` };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { t: "error", code: "rate", message: "Claude is rate-limited right now. Try again in a moment." };
  }
  if (err instanceof Anthropic.APIError) {
    return { t: "error", code: String(err.status ?? "api"), message: `Claude API error: ${err.message}` };
  }
  if (err instanceof Error && /api key|apiKey|authentication/i.test(err.message)) {
    return { t: "error", code: "auth", message: "ANTHROPIC_API_KEY is not set on the server." };
  }
  return { t: "error", message: err instanceof Error ? err.message : "Unknown error" };
}

export function jsonError(message: string, status: number, code?: string): Response {
  return Response.json({ t: "error", message, code }, { status });
}
