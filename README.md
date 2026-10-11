# Wingtern Lens

Learn anything through what you love. Lens explains technical, finance and everyday concepts through a student's interests (cricket, Formula 1, football, gaming or anything they describe), as a structured learning card:

1. **The concept**: a plain, analogy-free explanation (the accuracy anchor)
2. **The analogy**, with a **structural mapping table** pairing concept parts with analogy parts
3. **A visual**: step-through state, comparison table, or Mermaid diagram
4. **Watch it**: an animated explainer, written by Claude as code (no video model), with fullscreen and optional spoken narration (browser voice)
5. **A worked example** using real numbers
6. **Where the analogy breaks**
7. **Check yourself**: an MCQ with feedback on every option
8. **Simpler / another analogy / go deeper / switch interest**

Product spec: [PRD.md](PRD.md). Design system: [DESIGN.md](DESIGN.md).

## Run locally

```bash
npm install
cp .env.example .env.local   # then add ANTHROPIC_API_KEY
npm run dev
```

The three **example cards** on the home screen (binary search × cricket, compound interest × gaming, diversification × football) are hand-checked, include animations, and work without an API key.

## Deploy (Vercel Hobby)

1. Push this folder to a GitHub repo.
2. In Vercel: **Add New → Project → Import** the repo (framework is auto-detected as Next.js).
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY` and `LENS_PASSWORD` (the site's access password; comma-separate several to give different people their own). Optionally add `LENS_AUTH_SECRET` (a random string) so that removing one password only signs out that password's users. Without `LENS_PASSWORD`, only visitors with their own API key can get in (see below).

**Bring your own key.** Visitors can paste their own Anthropic API key on the login page or under **Your API key** in the top bar. Their usage is billed to them, not to the owner's credits. Keys are kept in the visitor's browser, sent to Anthropic through Lens's server per request, and never stored or logged on the server. A key needs access to the models in use (`claude-opus-5-5`, `claude-haiku-5-5`).
4. Deploy.

Also set a **spend limit** on the API key's workspace in the Anthropic Console (PRD §8.2a).

## How it works

| Route | Model | Notes |
|---|---|---|
| `POST /api/explain` | `claude-opus-5-5` · effort medium | Structured output (zod schema), streamed as NDJSON; the client renders sections as they arrive |
| `POST /api/animate` tier 1 | `claude-opus-5-5` · effort low | JSON scene script, played by an SVG + CSS player (`ScenePlayer`) |
| `POST /api/animate` tier 2 | `claude-opus-5-5` · effort high | A self-contained HTML motion piece, run in a sandboxed iframe with a no-network CSP |
| `POST /api/repair` | `claude-haiku-5-5` | Fixes Mermaid syntax once before falling back |

- Requests use server-side refusal fallbacks (`fallbacks: "default"`) and retry without them if the API rejects the parameter.
- Signed-out visitors can see the home page, the example cards and their animations, and the insights report. Asking a new question asks them to sign in with the password or add their own key. `src/proxy.ts` gates everything else: other pages redirect to `/login`, and APIs return 401 unless the request has the password session or carries the visitor's key. Sessions are HMAC-signed, httpOnly cookies that last 30 days. Failed logins and key checks are limited to 8 per 15 minutes per IP.
- Claude calls use the visitor's key when one is sent (header `x-lens-key`), and the server's `ANTHROPIC_API_KEY` otherwise. Visitors with their own key get a higher per-IP limit, since they don't use the owner's credits.
- Downloading insights builds a printable report from the card (and any generated animation storyboard) and saves it as PDF through the browser's print dialog. It makes no extra Claude calls.
- Rate limiting on the Claude routes is per IP and in memory (best effort), as a second layer.
- With narration on, cinematic clips pause at each new beat until the previous caption has been spoken. An injected virtual clock (`src/components/motion/clipRuntime.ts`) freezes the clip's timers, frames and CSS animations.
- Learning signals (cards, check answers, "did this click?") are stored in `localStorage` only.
- Visuals can be enlarged in a lightbox (zoom and pan for diagrams).
- Light and dark themes follow the OS setting, with a toggle in the top bar. Tokens live in `src/app/globals.css`.
- Narration uses the Web Speech API: free and offline, but voice quality depends on the device. Edge and Chrome "Natural" voices sound best.

Model overrides: `LENS_CARD_MODEL`, `LENS_SCENE_MODEL`, `LENS_CINEMATIC_MODEL`.
