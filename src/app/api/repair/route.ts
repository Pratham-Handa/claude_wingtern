import { z } from "zod";
import { MODELS, claude, jsonError } from "@/lib/server/claude";
import { passcodeOk, rateLimit } from "@/lib/server/ratelimit";

export const maxDuration = 30;

const RepairRequest = z.object({
  mermaid: z.string().max(4000),
  error: z.string().max(1000),
});

export async function POST(req: Request) {
  if (!passcodeOk(req)) return jsonError("Passcode required.", 401, "pass");
  if (!rateLimit(req, "repair", 40)) return jsonError("Repair limit reached.", 429, "limit");
  const parsed = RepairRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid request.", 400, "bad");

  try {
    const res = await claude().messages.create({
      model: MODELS.repair,
      max_tokens: 4000,
      system:
        "You fix Mermaid diagram syntax. Return ONLY the corrected Mermaid source, with no fences and no commentary. Keep the meaning and node labels. Use simple ids, put every label in double quotes, and remove styling, comments and special characters outside quotes.",
      messages: [
        { role: "user", content: `Parser error:\n${parsed.data.error}\n\nMermaid source:\n${parsed.data.mermaid}` },
      ],
    });
    const text = res.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .replace(/^```(?:mermaid)?\s*|```\s*$/g, "")
      .trim();
    return Response.json({ mermaid: text });
  } catch {
    return jsonError("Repair failed.", 502, "repair");
  }
}
