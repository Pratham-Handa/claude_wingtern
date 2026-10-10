# Wingtern Lens — Product Requirements Document

**Status:** Draft v0.1 · **Date:** 2026-10-10 · **Context:** 4-hour Claude Community Build Day prototype

---

## 1. Summary

Lens is a web app that teaches a concept through something the student already loves. A student picks a few interests (e.g. cricket, Formula 1), asks a question, and gets a structured **learning card** rather than a wall of text: the real concept, an analogy whose parts map explicitly onto the concept, a diagram, a worked example, where the analogy breaks, and a quick check question.

Lens ships standalone first. Later it becomes Wingtern's teaching layer: the roadmap says *what* to learn, Lens helps the student *learn it*.

**Core principle:** accuracy comes before entertainment. The analogy is there to support the concept and never stands in for it.

---

## 2. Problem

- Generic explanations (textbooks, ChatGPT-style answers) assume a neutral reader. Many students disengage before the idea lands.
- Existing "explain it like X" prompting produces **cosmetic analogies**: the same answer with cricket words swapped in. These are shallow and often wrong.
- Students rarely find out whether they actually understood. They read, nod and move on.

## 3. Target User (prototype)

A student aged 16–22 who has at least one strong interest and is stuck on a specific concept. Lens is **domain-agnostic**. Questions can be:
- **Technical:** binary search, recursion, concurrency, APIs
- **Quantitative:** probability, compound interest, statistics
- **Finance and business:** inflation, diversification, equity vs debt, supply and demand, opportunity cost
- **Everyday:** "why do airlines overbook?", "how does a credit score work?"

Technical concepts are not treated as the default. The prompt, the visuals and the showcase set all cover both technical and non-technical topics.

## 4. Goals and Non-Goals

### Goals (Build Day)
1. A student can pick interests and ask any question in under 30 seconds.
2. Each answer is a structured learning card with a **reliable, rendered visual**.
3. Each analogy contains an explicit **mapping table** (analogy element ↔ concept element) and a **"where it breaks"** section.
4. The student can check their understanding with one question and get instant feedback.
5. The student can say *simpler / another analogy / go deeper*, and the card regenerates.
6. The student can tap **"Watch it"** to get a short animated explainer of the analogy (§7A).
7. The app is **deployed on Vercel** with a public URL.
8. A demo that holds up live in front of judges.

### Non-Goals (Build Day)
- Authentication, accounts, databases or a backend persistence layer
- Wingtern integration
- Real personalisation or learning models (we only *log signals* for it)
- Mobile-native apps, voice and video
- Arbitrary visual formats beyond the supported set
- Downloadable MP4 export and AI voice-over (animations play in the browser only)
- Photorealistic or generative-video-model footage

---

## 5. The Key Differentiator: Structural Analogies

A **cosmetic analogy** looks like this: *"Binary search is like a cricket match. You search for the batsman…"*

A **structural analogy** maps the concept's parts and operations onto the interest:

| Concept (Binary Search) | Analogy (ICC Batting Rankings) |
|---|---|
| Sorted array | Rankings list ordered by rating points |
| Target value | The player whose rank you want to find |
| Check middle element | Open the list at rank #50 |
| Discard half | "Their rating is higher, so they're in the top 50" |
| O(log n) | ~7 checks for 100 players, not 100 |

**Where it breaks:** the rankings must already be sorted. If you only had a squad list in alphabetical order with no ratings, binary search on ratings wouldn't work.

The mapping table is **required output** and is shown to the student. It forces the model to reason structurally, and it gives the student a way to check the analogy for themselves.

---

## 6. User Experience

### 6.1 Flow
1. **Onboarding:** pick 1–3 interests from tiles. Saved to localStorage.
2. **Ask:** a single input box with suggested starter questions per interest.
3. **Learning card:** sections stream in as they are generated (see 6.2).
4. **Check:** answer the MCQ and get an explanation of why each option is right or wrong.
5. **Adjust:** buttons for `Simpler` · `Another analogy` · `Go deeper` · `Use a different interest`.
6. **Feedback:** "Did this click?" 👍 / 👎, logged locally.

### 6.2 Learning Card Sections (in order)

| # | Section | Required | Notes |
|---|---|---|---|
| 1 | **The concept**: plain explanation | ✅ | 2–4 sentences, interest-free. Accuracy anchor. |
| 2 | **The analogy** | ✅ | Short narrative in the chosen interest |
| 3 | **Mapping table** | ✅ | 3–6 rows, concept ↔ analogy |
| 4 | **Visual** | ✅ when useful | One of the supported formats (§7) |
| 5 | **Worked example** | ✅ | Concrete steps; connects the analogy back to the real concept (e.g. actual array values) |
| 6 | **Where the analogy breaks** | ✅ | 1–3 bullet points |
| 7 | **Check yourself** | ✅ | One MCQ with 4 options and per-option explanations |
| 8 | **Go further** | Optional | One-line "next concept to learn" |

### 6.3 Interests (MVP)
Four interests with curated example content:
- 🏏 Cricket
- 🏎️ Formula 1
- ⚽ Football
- 🎮 Gaming

Stretch: a free-text "Other" interest (e.g. "Taylor Swift eras", "Minecraft redstone").

**Interest selection logic:** the model picks whichever of the student's interests fits the concept *structurally* best and says why in one line (e.g. *"F1 pit stops, because concurrency is about parallel crews working on one car."*). If none fits well, it says so and uses the closest one rather than forcing it.

---

## 7. Visual Formats

Reliability matters more than variety. The prototype supports exactly these:

| Type | Renderer | Good for |
|---|---|---|
| `flowchart` | Mermaid | Algorithms, processes, decisions |
| `graph` | Mermaid | Networks, relationships (passing networks, graph theory) |
| `sequence` | Mermaid | Concurrency, request/response, pit-stop timing |
| `steps` | Custom React component | Step-by-step state changes (e.g. binary search narrowing the range) |
| `comparison` | Custom React table | X vs Y, before/after |

**Reliability rules**
- The model returns visual data as structured JSON. Mermaid source is a string field.
- The client validates Mermaid with `mermaid.parse()` before rendering. On failure it makes **one** repair call ("fix this Mermaid syntax"); if that also fails, it falls back to the `steps` format or hides the visual.
- The `steps` format is pure JSON (`[{label, state, highlight}]`) rendered by our own component, so it cannot break. It is the default for algorithms.

**Non-technical fit:** finance and everyday concepts lean on `comparison` (e.g. stocks vs bonds), `flowchart` (e.g. how a loan application flows) and `steps` (e.g. compound interest year by year, shown as a running value). A simple `bar` series inside `steps` (e.g. a balance growing each year) is a stretch addition.

---

## 7A. Animated Explainers ("Watch it")

### Background
Anthropic launched **Claude Motion** in beta on 2026-10-08. It turns text and diagrams into animated explainer videos without a video generation model: the animation is code that can be edited and exported to MP4. According to press coverage it is a **claude.ai product feature for Team and Enterprise plans**, and **we have found no public API** for it. Lens therefore can't call Motion directly. Instead it uses the same technique: Claude writes the animation as code, and Lens renders it in the browser.

### Approach (two tiers)

**Tier 1 (MVP, reliable): Scene-script player.** Claude returns a JSON **scene script** and our own React player animates it with **SVG + CSS transitions / the Web Animations API**. There is no animation library, in line with DESIGN.md's "zero animation libraries" rule (§7B).

```json
{
  "duration_s": 30,
  "scenes": [
    {
      "id": "s1", "duration_s": 6,
      "caption": "100 batters, ranked by rating points",
      "elements": [
        { "id": "list", "kind": "row_of_boxes", "count": 10, "labels": ["#1","#10","#20","…"] }
      ],
      "actions": [
        { "at": 0.5, "target": "list", "do": "fade_in" },
        { "at": 3.0, "target": "list[4]", "do": "highlight", "color": "accent" }
      ]
    }
  ]
}
```

- A small fixed set of element kinds: `box`, `row_of_boxes`, `circle/node`, `arrow`, `label`, `counter`, `bar`, `icon` (cricket ball, car, coin, etc. from a small built-in SVG set).
- A small fixed set of actions: `fade_in`, `fade_out`, `move_to`, `highlight`, `connect`, `count_to`, `grow`, `split`.
- Captions on every scene carry the narration, so no audio is needed.
- The player supports play/pause, scrubbing and a scene list.
- Because the vocabulary is constrained and validated, it **can't produce a broken render**: unknown kinds or actions are skipped.

**Tier 2 (stretch, "wow"): Free-form Opus animation.** Opus 5.5 writes a single self-contained HTML file (SVG/Canvas + JS, no external network). Lens plays it in a **sandboxed iframe** (`sandbox="allow-scripts"`, no `allow-same-origin`) inside a fixed 16:9 stage. This matches the community "motion graphics from code" pattern and looks more polished, but it is slower (often 30–90s) and less predictable.
- Use it only for **pre-generated showcase clips** plus an optional "Generate cinematic version" button.
- If it errors or produces a blank render, fall back to Tier 1.

**Optional demo extra (only if available):** API credits don't include claude.ai's Motion feature, which is tied to Team/Enterprise claude.ai plans. If the org also has a claude.ai Team/Enterprise workspace, produce one showcase clip in Claude Motion, export the MP4 and embed it as "here's where this is heading". Otherwise skip this; Tier 2 covers the same idea.

### Generation flow
1. The student taps "Watch it" on a card.
2. `/api/animate` sends the card's `analogy`, `mapping` and `worked_example` to Claude and asks for a scene script (Tier 1) or HTML (Tier 2).
3. The script is validated against the schema. On failure the app makes one repair call, then shows "animation unavailable" while the card stays fully usable.
4. The script is cached in localStorage per card.

**Models:** both tiers use `claude-opus-5-5`, Tier 1 at effort `low` and Tier 2 at effort `high` (§8.2).

---

## 7B. Visual Design (source: [DESIGN.md](DESIGN.md))

Lens uses the Wingtern design system, *Editorial · Tactile · Warm Academic*, so it already looks like part of Wingtern. DESIGN.md is the source of truth for tokens, type and components. Below is how its rules apply to Lens.

### Token setup
- Next.js now ships **Tailwind v4**, which is configured in CSS. The DESIGN.md §10 tokens (written as a v3 JS config) are translated into an `@theme` block in `globals.css`, alongside the §11 CSS variables. Names and values stay the same.
- Fonts are loaded with `next/font` (DM Sans, DM Mono, Playfair Display) instead of the Google Fonts `@import`, which is faster and avoids layout shift.
- Icons come from Lucide React, kept small (11–18px) and used like punctuation.
- `meta theme-color` is `#102a43`.

### Lens component mapping

| Lens element | DESIGN.md pattern |
|---|---|
| Top bar + brand | W mark (`9px 9px 9px 2px` radius, orange) + "wingtern **lens**" wordmark |
| Onboarding / ask screen | **Hero banner** (§8.8): mint bg, DM Mono eyebrow "WINGTERN LENS", H1 like *Learn anything through what you <em>love</em>* with the `<em>` in Playfair italic orange |
| Question input | **Search input** (§8.6), full width |
| Interest tiles | **Action button** (§8.3) with a `.selected` state; each interest gets a category accent (§2.4) as a 3px top border |
| Learning card sections | **Cards** (§8.4): white, 1px line border, 6px radius; the section label is a DM Mono uppercase eyebrow |
| Analogy + mapping table | **AI panel** (§8.9): parchment `#fff8ec` sub-palette, which marks it as the "Lens" voice |
| Mapping table headers | DM Mono uppercase, muted colour, like the admin table headers |
| "Where it breaks" | Card with the **flagged** status colours (§2.5): `#fff0ec` bg, `#b04d46` text |
| Check-yourself MCQ | Options as action buttons. Correct answers use the **active** status colours, wrong answers use **flagged** |
| Primary CTA ("Explain it", "Watch it") | **Primary button** (§8.2) with the 3D bevel and press feedback |
| Mode buttons (Simpler / Another / Deeper) | Action buttons |
| Empty / loading state | **Empty state** (§8.11) with the ✦ glyph; skeleton sections, no shimmer animation |

**Interest accents (from §2.4):** cricket = mint `#5bb49c`, F1 = coral `#f58b68`, football = blue `#669bc5`, gaming = violet `#9376d5`, other/custom = gold `#e5ad53`.

### Motion: resolving the conflict with DESIGN.md
DESIGN.md says the interface should be *still*: no entrance animations, no animation libraries, and only 180ms micro-transitions. "Watch it" is animation by nature. The rule here:
- **The app chrome follows DESIGN.md exactly.** Streamed card sections appear without fade-ins, hovers lift in 180ms, and buttons press instantly.
- **The animation stage is content, not chrome.** It is a bounded 16:9 frame (cream bg, 1px line border, 8px radius) that only moves **after the student presses play**. There is no autoplay and nothing outside the frame moves.
- **Animations follow the brand too.** Scene scripts and Tier 2 prompts are limited to the palette (ink, cream, orange, teal, gold, interest accent), DM Sans/DM Mono captions and plain geometric shapes. The aim is "a printed explainer coming to life", not flashy motion graphics.
- `prefers-reduced-motion`: the player becomes a step-through slideshow (one scene per click).

### Diagrams
Mermaid uses the `base` theme with `themeVariables` mapped to the tokens: ink lines and text, white nodes, line-colour borders, an orange highlight, DM Sans font. Custom `steps` and `comparison` components use the same tokens, so every visual looks like one system.

### Dark mode (added after Build Day testing)
DESIGN.md defines only a light palette, so this dark palette was derived from it and keeps the same warm, academic feel. All colours are semantic CSS variables (`globals.css`). Tailwind maps onto them with `@theme inline`, so every `text-ink` / `bg-cream` class switches automatically.

| Token | Light | Dark |
|---|---|---|
| canvas | #f7f8f5 | #0f1b26 |
| surface (cards) | #ffffff | #162534 |
| text (ink) | #19324a | #e6edf1 |
| muted | #718293 | #93a5b4 |
| line | #dfe7e6 | #263a4b |
| orange | #f0724d | #f4845f |
| teal | #0b7771 | #3fb5aa |
| hero | #e6f0ec | #14302e |
| AI panel bg / border / text | #fff8ec / #f0d0a6 / #9c5e2a | #2a2116 / #5c4526 / #e9b886 |
| flagged bg / text | #fff0ec / #b04d46 | #3a1e1b / #f2a08f |

- The default follows the OS setting, with a System / Light / Dark toggle in the top bar. An inline `<head>` script sets `data-theme` before first paint, so there's no flash.
- The SVG explainer stage and Mermaid diagrams use the theme too: resolved token values come from `useThemeColors()`.
- Cinematic clips keep their light "paper" stage in both themes on purpose.

### Enlarge, fullscreen and narration
- **03 · See it** has an Expand button, and clicking the visual itself also opens a `<dialog>` lightbox. Steps and tables render larger. Diagrams support zoom and pan (wheel, buttons, drag).
- Both players have a **fullscreen** button. They use the Fullscreen API, with a fixed-overlay fallback for iPhone Safari.
- **Narration** uses the browser's built-in voice (Web Speech API). It's off by default and toggled per device. The explainer's clock holds at the end of each scene until its caption has been spoken. Cinematic clips forward their captions to the page through an injected `postMessage` bridge, since the sandbox blocks direct access.

### Don'ts carried over
No Tailwind default blue or grey, no `rounded-full` buttons or cards, no decorative shadows beyond the hover lift and CTA bevel, and only one breakpoint (`700px`).

---

## 8. System Design

### 8.1 Stack (chosen: Next.js, the easiest path to Vercel)
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind
- **Backend:** Next.js route handlers (`/api/explain`, `/api/animate`), so there is no separate server
- **LLM:** Claude via `@anthropic-ai/sdk`, using structured output (tool use with a JSON schema)
- **Visuals:** `mermaid` npm package + custom components
- **Styling:** Tailwind v4 with DESIGN.md tokens, `next/font`, Lucide React
- **Animation:** SVG + CSS / Web Animations API (Tier 1, no library), sandboxed iframe (Tier 2)
- **State:** React state + localStorage (interests, history, feedback, cached animations)
- **Deploy (required):** Vercel, connected through GitHub or the `vercel` CLI

### 8.1a Vercel Deployment Notes
- Set `ANTHROPIC_API_KEY` as a Vercel environment variable. It is only ever read server-side and never exposed to the client.
- **Plan: Vercel Hobby (free).** With Fluid compute (on by default) Hobby functions default to and max out at **300s**. That covers every call, even live Tier 2 (~30–90s). Each route still sets `export const maxDuration` explicitly (60s for cards, 300s for `/api/animate`) and **streams** responses to keep the connection alive and show progress.
- Hobby is intended for non-commercial use, which suits a Build Day prototype. Move to Pro before any commercial launch.
- Tier 2 animations are the slowest calls. They are pre-generated for the showcase and stored as static files in `/public/showcase/`, so the demo never depends on a long live call.
- **Deploy early (by hour 1)** with a hello-world route, so environment and timeout problems show up before the demo instead of during it.
- Basic abuse guard: a simple per-IP rate limit in memory, or a shared demo passcode, because the URL is public and spends API credits.

### 8.2 Model Strategy

| Call | Model | Why |
|---|---|---|
| Generate learning card | `claude-opus-5-5`, effort `low` | Accuracy is the core principle, and the budget allows Opus for every card (§8.2a). Measured: `low` streams first text in ~3s and finishes in ~23s; `medium` took ~19s to first text and ~38s in total, with no accuracy gain on test concepts |
| Accuracy review (stretch) | `claude-opus-5-5`, effort `high` | Second pass that checks the concept section and mapping table for errors and flags or fixes them |
| Mermaid / scene-script repair | `claude-haiku-5-5` | Small, fast syntax-fix task |
| Animation scene script (Tier 1) | `claude-opus-5-5`, effort `low` | Structured JSON; low effort keeps it fast enough to run live |
| Cinematic HTML animation (Tier 2) | `claude-opus-5-5`, effort `medium` | Best at long, coherent visual code. Measured: `high` took 271s (too close to the 300s Hobby limit); `medium` took 184s with the same quality. A server-side deadline aborts at 285s |

**Latency escape hatch:** if a live Opus card takes more than ~15s, first drop effort to `low`. If that is still too slow, switch card generation to `claude-sonnet-5-5`. The model is set in one config constant, so this is a one-line change.

**Refusal handling:** Opus 5.5 can return `stop_reason: "refusal"`. Enable server-side `fallbacks: "default"` and show a friendly "try rephrasing" message if a refusal still comes back.

### 8.2a API Budget ($100 org credits)

Pricing per million tokens (input / output): Opus 5.5 is $4 / $20, Sonnet 5.5 is $2 / $10 and Haiku 5.5 is $0.10 / $0.50. Thinking tokens bill as output.

| Item | Rough tokens (in / out incl. thinking) | Cost per call | Expected calls | Subtotal |
|---|---|---|---|---|
| Learning card (Opus, medium) | 5K / 5K | ~$0.12 | ~200 (prompt tuning + testing + demo) | ~$24 |
| Tier 1 scene script (Opus, low) | 4K / 4K | ~$0.10 | ~80 | ~$8 |
| Tier 2 cinematic HTML (Opus, high) | 4K / 20K | ~$0.40 | ~20 (3–4 clips × iterations) | ~$8 |
| Accuracy review (stretch) | 6K / 3K | ~$0.08 | ~50 | ~$4 |
| Haiku repairs | 2K / 1K | <$0.01 | any | ~$0 |
| **Total estimate** | | | | **~$45** |

This leaves roughly **$55 of headroom** for public traffic after the demo. These are estimates; check the real cost per call against `usage` on the first few requests.

**Spend guards**
- Prompt caching on the static system prompt and few-shot examples, which are most of the input tokens.
- A **spend limit on the API key's workspace** in the Anthropic Console (e.g. $80), so a public URL can't drain the org.
- Per-IP rate limit (e.g. 10 cards/hour) and caching of responses by `(question, interest, mode)`.

### 8.3 Output Schema (draft)

```json
{
  "concept_title": "string",
  "chosen_interest": "cricket | f1 | football | gaming | other",
  "interest_reason": "string",
  "concept_explanation": "string",
  "analogy": { "title": "string", "narrative": "string" },
  "mapping": [{ "concept": "string", "analogy": "string" }],
  "visual": {
    "type": "flowchart | graph | sequence | steps | comparison | none",
    "caption": "string",
    "mermaid": "string (for mermaid types)",
    "steps": [{ "label": "string", "state": "string", "highlight": "string" }],
    "comparison": { "columns": ["string"], "rows": [["string"]] }
  },
  "worked_example": [{ "step": "string", "concept_link": "string" }],
  "analogy_limits": ["string"],
  "check": {
    "question": "string",
    "options": [{ "text": "string", "correct": "boolean", "why": "string" }]
  },
  "next_concept": "string"
}
```

### 8.4 Request Modes
`/api/explain` accepts `{ question, interests[], mode, previous_card? }`, where `mode` is one of:
- `default`
- `simpler`: shorter, fewer jargon terms, more concrete
- `another_analogy`: a different interest or a different angle within the same interest
- `deeper`: adds edge cases, complexity and the formal definition

### 8.5 Prompting Principles
- The system prompt states the accuracy-first rule and the structural-mapping requirement explicitly.
- Include 2 gold-standard example cards (binary search × cricket, concurrency × F1) as few-shot examples.
- Instruct the model to write `concept_explanation` **before** the analogy, so the accuracy anchor is set first.
- Ask it to refuse forced analogies: "if no interest maps well, say so."

### 8.6 Learning Signals (groundwork for the long-term hypothesis)
Logged to localStorage for each card: `{concept, interest, visual_type, mode_requests[], check_correct, clicked}`. Nothing is modelled yet. The point is to show in the demo that the data needed to answer "what explanation style works for this student?" is already being captured.

---

## 9. Build Plan (4 hours)

The plan is tighter now that it includes animation and deployment. Background jobs (Opus generating the Tier 2 showcase clips) run **while** UI work happens.

| Time | Milestone |
|---|---|
| 0:00–0:20 | Scaffold Next.js + Tailwind, hello-world Claude route, **push to GitHub and deploy to Vercel**, set the env var |
| 0:20–1:00 | System prompt, JSON schema, `/api/explain`; test on 6 concepts (3 technical, 3 finance/everyday) |
| 1:00–1:45 | Learning card UI: all sections, mapping table, MCQ interaction |
| 1:45–2:20 | Visual renderers: Mermaid with validation/fallback, `steps`, `comparison` |
| 2:20–3:05 | **Animation Tier 1:** scene-script schema, `/api/animate`, SVG + CSS player. *In parallel:* kick off Opus Tier 2 generation for the 3 showcase concepts and save to `/public/showcase/` |
| 3:05–3:30 | Onboarding picker, mode buttons, localStorage, starter questions |
| 3:30–3:45 | Polish: loading states, streaming, styling. Redeploy |
| 3:45–4:00 | Rehearse on the **deployed URL**, warm the caches, fix bugs |

**Cut order if behind:** Opus review pass → free-text interest → Tier 2 "generate live" button (keep pre-generated clips) → `comparison` visual → `deeper` mode → Tier 1 live generation (fall back to pre-generated scene scripts only).

**Demo safety net:** pre-generate and save JSON for the 3 demo concepts (cards, scene scripts and Tier 2 HTML clips). If the API is slow or rate-limited on stage, serve from the cache.

**Showcase concepts (proposed, mixing domains):**
1. **Binary search × cricket rankings** (technical, `steps` visual)
2. **Compound interest × F1 championship points** or **× football club transfer budget** (finance, growth `steps`/`bar`)
3. **Diversification × building a gaming squad / F1 team strategy** (finance and risk, `comparison`)
4. Backup: **concurrency × F1 pit crew** (`sequence` visual)

---

## 10. Demo Script (~3 min)

1. **Hook:** "Same question, two students." Show binary search for a cricket fan, then for an F1 fan.
2. **Mapping table:** "Most AI just swaps in sports words. Lens maps the *structure*." Point at the table.
3. **Where it breaks:** "It tells you where the analogy stops being true. That's how you know it isn't lying to you."
4. **Check question:** answer it wrong on purpose and show the explanation.
5. **"Another analogy":** regenerate a concept in a different interest (e.g. compound interest → F1 to football).
6. **"Watch it":** play the animated explainer. "No video model: Claude writes the animation as code." Show the cinematic Opus clip for a showcase concept.
7. **Not just CS:** ask a live finance or everyday question from the audience.
8. **Vision:** "Every interaction is logged. Inside Wingtern, Lens learns which explanations work for *you*, tied to your career roadmap."

---

## 11. Success Criteria

**Build Day (qualitative)**
- 3 showcase concepts render end-to-end without errors
- Visuals render successfully in ≥90% of 10 test questions
- No factual errors in the concept section across the test set (manual review)
- At least one non-builder tester says "oh, that makes sense now"

**Post-Build-Day hypothesis to validate**
> Structural, interest-based analogies with explicit mappings and limits improve comprehension and retention compared with plain explanations, and the best explanation style varies per student in a learnable way.

Validation approach: A/B test plain vs Lens cards on the same concept, measuring check-question accuracy immediately and after 48 hours, plus self-reported clarity. This is a hypothesis, not an established finding.

---

## 12. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Analogy distorts the concept | Concept-first ordering, mandatory mapping table and limits section, optional Opus review |
| Forced or cringe analogies | Model chooses the best-fitting interest and may decline; gold few-shot examples |
| Mermaid syntax errors | `mermaid.parse()` validation → Haiku repair → fallback to `steps` |
| Latency (Opus structured output can take 10–25s) | Streaming or skeleton UI, effort tuning, Sonnet fallback (§8.2), cached demo responses |
| Credits run out | Estimated use is ~$45 of $100, plus a Console spend limit and rate limits (§8.2a) |
| API limits on the day | Cache, short prompts, Haiku for minor calls |
| Scope creep | Strict cut order (§9) |
| Animation looks janky or broken | Constrained scene vocabulary with validation (Tier 1), pre-generated Tier 2 clips, card works without the video |
| Opus-written HTML runs arbitrary JS | Sandboxed iframe (`allow-scripts` only, no same-origin), CSP blocks network access |
| Vercel function timeouts on long calls | Streaming, `maxDuration`, Tier 2 pre-generated as static files |
| Public URL burns API credits | Rate limit or demo passcode |
| Finance analogies that oversimplify risk | Mandatory "where it breaks" section; a "not financial advice" line on finance cards |

---

## 13. Path to Wingtern Integration (post-Build Day)

1. **Roadmap hook:** each Wingtern roadmap node (e.g. "Learn DSA: binary search") gets a "Learn with Lens" button.
2. **Shared profile:** interests, academic level and goals come from the Wingtern profile instead of onboarding.
3. **Mastery signal:** check-question results feed back into Wingtern's capability-gap model.
4. **Personalisation:** use the logged signals to rank interest × visual × mode combinations per student and concept type.
5. **Practice:** extend single MCQs into spaced-repetition practice sets.

---

## 14. Open Questions

1. ~~Domains~~: resolved. Lens is domain-agnostic, finance and everyday included (§3).
2. ~~Deploy~~: resolved. Vercel is required (§8.1a).
3. ~~Stack~~: resolved. Next.js (§8.1).
4. ~~Credits~~: resolved. $100 of org API credits, so Opus 5.5 is the default (§8.2a). Still open: does the org also have a claude.ai Team/Enterprise workspace for the optional Motion clip?
5. ~~Vercel plan~~: resolved. Hobby (free) with a 300s function limit (§8.1a).
6. ~~Design~~: resolved. The Wingtern design system from [DESIGN.md](DESIGN.md) (§7B).
7. The brief was cut off after "It does not need authentication, a database, …". Are there further constraints to add?
