/**
 * Bring-your-own-key: a visitor can send their own Anthropic API key per request
 * (header x-lens-key). Their usage is billed to them, not to the site owner.
 * The key is never stored on the server or written to logs.
 */
export const KEY_HEADER = "x-lens-key";

const KEY_PATTERN = /^sk-ant-[A-Za-z0-9_-]{20,300}$/;

export function isAnthropicKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/** The visitor's key from the request, or an error when the header is malformed. */
export function keyFromRequest(req: Request): { apiKey?: string; error?: string } {
  const raw = req.headers.get(KEY_HEADER);
  if (!raw) return {};
  return isAnthropicKey(raw) ? { apiKey: raw } : { error: "That API key doesn't look right. Check it under Your API key." };
}
