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
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY`. Optionally add `LENS_PASSCODE` to gate the public URL.
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
- Rate limiting is per IP and in memory (best effort), with an optional passcode.
- Learning signals (cards, check answers, "did this click?") are stored in `localStorage` only.
- Visuals can be enlarged in a lightbox (zoom and pan for diagrams).
- Light and dark themes follow the OS setting, with a toggle in the top bar. Tokens live in `src/app/globals.css`.
- Narration uses the Web Speech API: free and offline, but voice quality depends on the device. Edge and Chrome "Natural" voices sound best.

Model overrides: `LENS_CARD_MODEL`, `LENS_SCENE_MODEL`, `LENS_CINEMATIC_MODEL`.
