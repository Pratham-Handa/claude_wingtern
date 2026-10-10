# Wingtern Design System

> Extracted from [wingtern-mal.vercel.app](https://wingtern-mal.vercel.app/) and [Pratham-Handa/wingternMAL](https://github.com/Pratham-Handa/wingternMAL).
> This document defines the visual language for the new Wingtern monorepo.

---

## 1. Design Philosophy

**Editorial · Tactile · Warm Academic**

Wingtern's visual identity blends three moods:

| Mood | How it shows up |
|---|---|
| **Editorial** | Playfair Display serif accents in hero headlines, tight letter-spacing, monospace metadata labels |
| **Tactile** | 3D-beveled CTA buttons with `box-shadow` depth, cards that lift on hover, physical press feedback |
| **Warm Academic** | Cream canvas background, deep ink navy text, terracotta/coral accent, forest teal secondary — feels like a well-designed campus bulletin board, not a SaaS dashboard |

The overall feel: **calm confidence, not startup urgency**. Text is readable. Whitespace is generous. Color is used deliberately, not abundantly.

---

## 2. Color System

### 2.1 Core Semantic Tokens

These are the CSS custom properties defined on `:root`:

| Token | Hex | HSL | Role |
|---|---|---|---|
| `--ink` | `#19324a` | `hsl(209, 49%, 19%)` | Primary text, headings, active states |
| `--cream` | `#f7f8f5` | `hsl(80, 14%, 96%)` | Page background / canvas |
| `--orange` | `#f0724d` | `hsl(14, 85%, 62%)` | Primary accent — CTAs, brand mark, active nav underline, icon highlights |
| `--teal` | `#0b7771` | `hsl(177, 83%, 25%)` | Secondary accent — links, eyebrows, focus rings, interactive states |
| `--muted` | `#718293` | `hsl(210, 14%, 51%)` | Secondary text, inactive nav, descriptions, table headers |
| `--line` | `#dfe7e6` | `hsl(173, 14%, 89%)` | Borders, dividers, card outlines |

### 2.2 Extended Palette

| Name | Hex | Usage |
|---|---|---|
| **Focus ring** | `#e9af48` | `outline: 3px solid #e9af48; outline-offset: 3px` — accessible keyboard focus |
| **Button bevel** | `#d95d3c` | 3D shadow under primary buttons |
| **Hero bg** | `#e6f0ec` | Mint/seafoam container background |
| **Hero copy** | `#5e7380` | Body text inside hero |
| **Hero gold** | `#e5a747` | Decorative orbit marker |
| **Sparkle bg** | `#fff2eb` | Light peach circle behind decorative icons |
| **Error** | `#b14643` | Validation errors |
| **Destructive text** | `#9a6870` | Muted rose/wine for dangerous actions |
| **Avatar bg** | `#e1efeb` | Mint circle, border `#cedbd9` |
| **Admin shell bg** | `#f3f6f5` | Cool grey admin background |
| **Admin table header** | `#f7f9f8` | Off-white table header |
| **Theme color** (meta) | `#102a43` | Browser chrome / OS bar |

### 2.3 AI Panel Colors

| Name | Hex | Usage |
|---|---|---|
| **AI bg** | `#fff8ec` | Warm parchment panel background |
| **AI border** | `#f0d0a6` | Tan panel border |
| **AI text** | `#9c5e2a` | Caramel/leather label text |
| **AI tag bg** | `#f6e3c4` | Chip/tag background |
| **AI secondary** | `#897966` | Subtle description text |
| **AI meta** | `#9c876e` | "Local AI · no internet needed" |
| **AI divider** | `#ead5b5` | Suggestion section border |
| **AI button border** | `#eab675` | Button outline |
| **AI suggestion meta** | `#ae9678` | Secondary label text |

### 2.4 Category Accent Colors

Each opportunity type gets a 3px colored top border on its card:

| Category | Class | Hex | HSL |
|---|---|---|---|
| EVENT | `coral` | `#f58b68` | `hsl(15, 87%, 68%)` |
| HACKATHON | `violet` | `#9376d5` | `hsl(258, 52%, 65%)` |
| WORKSHOP | `gold` | `#e5ad53` | `hsl(37, 74%, 61%)` |
| INTERNSHIP | `mint` | `#5bb49c` | `hsl(164, 37%, 53%)` |
| LEARNING | `blue` | `#669bc5` | `hsl(206, 45%, 59%)` |
| PROJECT | `orange` | `#ed9861` | `hsl(23, 80%, 65%)` |
| COLLABORATION | `pink` | `#d27a9d` | `hsl(336, 49%, 65%)` |
| OTHER | `slate` | `#9aaab2` | `hsl(201, 14%, 65%)` |

### 2.5 Status Indicators

| Status | Dot color | Badge bg | Badge text |
|---|---|---|---|
| ACTIVE | `#54aa8c` | `#eff7f4` | `#497378` |
| CLOSED | `#a0abb3` | `#edf0f0` | `#68757f` |
| FLAGGED | `#e26b50` | `#fff0ec` | `#b04d46` |

---

## 3. Typography

### 3.1 Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');
```

| Role | Family | Weights | Usage |
|---|---|---|---|
| **Primary** | `'DM Sans', system-ui, sans-serif` | 400, 500, 600, 700 | All body text, labels, buttons, inputs |
| **Monospace** | `'DM Mono', monospace` | 400, 500 | Eyebrow labels, category pills, badges, stats, table headers |
| **Serif accent** | `'Playfair Display', Georgia, serif` | 500, 600 (+ italic) | Hero headline emphasis (`<em>` tags only) |
| **Brand glyph** | `Georgia, serif` | — | Single "W" letter inside brand mark |

### 3.2 Type Scale

| Element | Size | Line Height | Letter Spacing | Weight | Notes |
|---|---|---|---|---|---|
| **Hero H1** | `clamp(34px, 5vw, 57px)` | `1.04` | `-2.4px` | 700 | Fluid responsive. `<em>` uses Playfair Display italic |
| **Detail H1** | `clamp(38px, 6vw, 68px)` | `1.04` | `-2.4px` | 700 | Larger version for detail pages |
| **Section H2** | `25px` | default | `-0.8px` | 700 | `21px` on mobile |
| **Card H3** | `19px` | default | `-0.35px` | 700 | |
| **Create header H1** | `47px` | `1.04` | `-2.4px` | 700 | `39px` on mobile |
| **Admin H1** | `45px` | `1.04` | `-2.4px` | 700 | `38px` on mobile |
| **Body / description** | `13px` | `1.65` | normal | 400 | Card descriptions, form inputs |
| **Hero copy** | `15px` | default | normal | 400 | |
| **Detail description** | `17px` | `1.7` | normal | 400 | |
| **Brand** | `21px` | default | `-0.6px` | 700 | `18px` on mobile |
| **Nav** | `14px` | default | normal | 600 | `12px` on mobile |
| **Eyebrow** | `11px` | default | `1.5px` | 500 | DM Mono, uppercase |
| **Pill / badge** | `10px` | default | `0.5px` | 400 | DM Mono, uppercase |
| **Stat number** | `33px` | default | `-1px` | 700 | `27px` on mobile |
| **Micro labels** | `11px` | default | normal | 400–600 | Table cells, timestamps, field hints |
| **AI panel heading** | `13px` | default | normal | 700 | |
| **AI panel body** | `12px` | `1.6` | normal | 400 | |

---

## 4. Spacing & Layout

### 4.1 Container Widths

| Context | Max Width |
|---|---|
| Main content | `1180px` |
| Detail / create views | `1000px` |

### 4.2 Page Padding

| Breakpoint | Padding |
|---|---|
| Desktop | `56px 24px 80px` |
| Mobile (≤700px) | `24px 16px 60px` |

### 4.3 Topbar

| Property | Desktop | Mobile |
|---|---|---|
| Height | `80px` | `67px` |
| Horizontal padding | `max(24px, calc((100vw - 1180px) / 2))` | `16px` |
| Item gap | `48px` | `17px` |
| Position | `sticky` top, `z-index: 10` | Same |
| Background | `rgba(247, 248, 245, 0.94)` with `backdrop-filter: blur(10px)` | Same |

### 4.4 Grid Layouts

| Grid | Desktop | Mobile |
|---|---|---|
| **Feed** | `repeat(2, minmax(0, 1fr))` gap `16px` | `1fr` |
| **Detail** | `1fr 280px` gap `75px` | `1fr` gap `35px` |
| **Create form** | `1fr 330px` gap `45px` | `1fr` gap `35px` |
| **Two-col fields** | `1fr 1fr` gap `15px` | `1fr` |
| **Admin stats** | `repeat(4, 1fr)` gap `14px` | `repeat(2, 1fr)` |

### 4.5 Responsive Breakpoint

**Single breakpoint: `700px`**

```css
@media (max-width: 700px) { /* mobile styles */ }
```

The design uses a single breakpoint — not a complex multi-breakpoint system. Everything is desktop-first with one mobile override.

---

## 5. Border Radii

| Element | Radius |
|---|---|
| **Brand mark** ★ | `9px 9px 9px 2px` — asymmetric "folded leaf" signature |
| **Hero container** | `8px` |
| **Cards** | `6px` |
| **Search, AI panel** | `5px` |
| **Buttons** | `4px` (primary), `3px` (AI) |
| **Inputs, pills, badges** | `3px` |
| **Avatar, AI icon, sparkle** | `50%` (circle) |

> [!IMPORTANT]
> The brand mark's asymmetric `9px 9px 9px 2px` radius is a key brand detail — it creates a distinctive "stamp" or "paper kite" shape. This should be preserved everywhere the W mark appears.

---

## 6. Shadows & Elevation

### 6.1 Tactile Button (Primary CTA)

```css
/* Default */
box-shadow: 0 4px 0 #d95d3c;

/* Pressed */
transform: translateY(2px);
box-shadow: 0 2px 0 #d95d3c;
```

This creates a physical "keyboard key" press feel — a signature Wingtern interaction.

### 6.2 Card Hover

```css
/* Default: flat, border only */
border: 1px solid var(--line);

/* Hover */
transform: translateY(-3px);
box-shadow: 0 10px 25px rgba(25, 50, 74, 0.08);
```

### 6.3 Input Focus

```css
border-color: var(--teal);
box-shadow: 0 0 0 3px rgba(11, 119, 113, 0.1);
```

### 6.4 Keyboard Focus (Global)

```css
outline: 3px solid #e9af48;
outline-offset: 3px;
```

---

## 7. Motion & Transitions

The design uses **zero animation libraries**. All motion is CSS-only:

| Element | Transition | Duration |
|---|---|---|
| Card hover | `transform, box-shadow` | `0.18s` (180ms) |
| Button press | `transform` (translateY) | instant (no transition) |

> [!NOTE]
> The 180ms card transition is deliberately fast — snappy micro-feedback, not springy or bouncy. The design avoids orchestrated animations, entrance animations, or scroll-driven motion. This is intentional: the interface should feel immediate and print-like, not app-like.

---

## 8. Component Patterns

### 8.1 Brand Mark

```
┌──────────────────┐
│  ┌─────┐         │
│  │  W  │ wingtern│
│  └─────┘         │
└──────────────────┘
```

- Mark: `29×29px` grid, `border-radius: 9px 9px 9px 2px`, `background: var(--orange)`, white Georgia serif "W"
- Wordmark: `21px`, weight `700`, letter-spacing `-0.6px`, color `var(--ink)`

### 8.2 Primary Button

```css
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 13px 18px;
  border: 0;
  border-radius: 4px;
  background: var(--orange);       /* #f0724d */
  color: white;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 4px 0 #d95d3c;    /* 3D bevel */
}
.primary-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #d95d3c;
}
```

### 8.3 Secondary / Action Button

```css
.action-button {
  padding: 15px;
  border: 1px solid #bbd0cd;
  border-radius: 4px;
  color: var(--teal);
  background: white;
  font-size: 13px;
  font-weight: 700;
}
.action-button.selected {
  border-color: var(--teal);
  background: #e5f2ee;
}
```

### 8.4 Opportunity Card

```css
.opportunity-card {
  min-height: 218px;
  padding: 24px;
  border: 1px solid var(--line);
  border-top: 3px solid transparent;   /* colored per category */
  border-radius: 6px;
  background: white;
  transition: transform 0.18s, box-shadow 0.18s;
}
.opportunity-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(25, 50, 74, 0.08);
}
```

**Structure:** Card top (pill + status) → H3 title → description paragraph → card bottom (location + action)

### 8.5 Category Pill / Badge

```css
.category-pill {
  display: inline-flex;
  padding: 5px 9px;
  border-radius: 3px;
  color: #497378;
  background: #eff7f4;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
```

### 8.6 Search Input

```css
.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(480px, 100%);
  padding: 0 14px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 5px;
}
.search-wrap:focus-within {
  border-color: var(--teal);
  box-shadow: 0 0 0 3px rgba(11, 119, 113, 0.1);
}
.search-wrap input {
  width: 100%;
  height: 44px;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
  font-size: 13px;
}
```

### 8.7 Form Fields

```css
.field input, .field select, .field textarea {
  width: 100%;
  border: 1px solid #d5e0df;
  border-radius: 3px;
  padding: 12px;
  color: var(--ink);
  background: white;
  font-size: 13px;
}
.field input:focus, .field select:focus, .field textarea:focus {
  border-color: var(--teal);
}
.field > label {
  color: var(--ink);
  font-size: 13px;
  font-weight: 700;
}
.field small { color: var(--muted); font-size: 11px; }
.field small.error { color: #b14643; font-weight: 600; }
```

### 8.8 Hero Banner

```css
.hero {
  min-height: 230px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 42px;
  border-radius: 8px;
  background: #e6f0ec;
  overflow: hidden;
  position: relative;
}
```

Content: Eyebrow (`DM Mono`, `11px`, teal) → H1 (fluid `clamp()`, with `<em>` in Playfair Display orange) → subtitle (15px `#5e7380`).

Decorative: CSS-drawn concentric orbit ellipses with teal borders at varying opacities and rotations, plus glyph markers (✦ orange, ↗ teal, • gold).

### 8.9 AI Panel

```css
.ai-panel {
  padding: 22px;
  border: 1px solid #f0d0a6;
  border-radius: 5px;
  background: #fff8ec;
  align-self: start;
}
```

Warm amber tones throughout. Icon: `27×27px` orange circle. Tags: `#f6e3c4` bg, `#9c5e2a` text, `3px` radius, `10px` font. Completely isolated color sub-system from the main teal/orange palette.

### 8.10 Stat Card (Admin)

```css
.stat-card {
  padding: 20px;
  border-top: 3px solid #67a5c2;  /* blue default, or .mint/.slate/.coral */
  background: white;
}
.stat-card strong {
  font-size: 33px;
  letter-spacing: -1px;
}
.stat-card span, .stat-card small {
  color: var(--muted);
  font-size: 11px;
}
```

### 8.11 Empty State

```css
.empty-state {
  padding: 75px 20px;
  text-align: center;
  background: white;
  border: 1px dashed #cbd8d6;
}
```

Uses orange `✦` glyph as decorative icon.

---

## 9. Iconography & Glyphs

Wingtern MAL uses **Unicode glyphs instead of an icon library**:

| Glyph | Unicode | Usage |
|---|---|---|
| ✦ | U+2726 | Empty state, sparkle icon, AI marker |
| ↗ | U+2197 | "View details", external link indicator |
| ⌕ | U+2315 | Search icon |
| ⌖ | U+2316 | Location marker |
| ♡ | U+2661 | Save (unsaved state) |
| 🔖 | U+1F516 | Save (saved state) |
| ＋ | U+FF0B | Add/create action |
| ✓ | U+2713 | Confirmed/interested state |
| ⚠ | U+26A0 | Validation warning |
| ← | U+2190 | Back navigation |
| • | U+2022 | Status dot |

> [!TIP]
> For the new monorepo, we can adopt **Lucide React** icons (already installed) while keeping the same visual weight and sizing. The glyph style is small (11–18px) and inline — icons should feel like punctuation, not decoration.

---

## 10. Tailwind Configuration (For New Monorepo)

This translates the MAL design tokens into the Tailwind config for `apps/web`:

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#19324a',
        cream: '#f7f8f5',
        orange: {
          DEFAULT: '#f0724d',
          bevel: '#d95d3c',
          sparkle: '#fff2eb',
        },
        teal: {
          DEFAULT: '#0b7771',
          light: '#e5f2ee',
          focus: 'rgba(11, 119, 113, 0.1)',
        },
        muted: '#718293',
        line: '#dfe7e6',
        hero: {
          bg: '#e6f0ec',
          copy: '#5e7380',
          gold: '#e5a747',
        },
        focus: '#e9af48',
        error: '#b14643',
        destructive: '#9a6870',
        avatar: {
          bg: '#e1efeb',
          border: '#cedbd9',
        },
        admin: {
          shell: '#f3f6f5',
          header: '#f7f9f8',
        },
        ai: {
          bg: '#fff8ec',
          border: '#f0d0a6',
          text: '#9c5e2a',
          tag: '#f6e3c4',
          secondary: '#897966',
          meta: '#9c876e',
          divider: '#ead5b5',
          button: '#eab675',
        },
        category: {
          coral: '#f58b68',
          violet: '#9376d5',
          gold: '#e5ad53',
          mint: '#5bb49c',
          blue: '#669bc5',
          orange: '#ed9861',
          pink: '#d27a9d',
          slate: '#9aaab2',
        },
        status: {
          active: '#54aa8c',
          'active-bg': '#eff7f4',
          'active-text': '#497378',
          closed: '#a0abb3',
          'closed-bg': '#edf0f0',
          'closed-text': '#68757f',
          flagged: '#e26b50',
          'flagged-bg': '#fff0ec',
          'flagged-text': '#b04d46',
        },
        field: {
          border: '#d5e0df',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      fontSize: {
        'hero': ['clamp(34px, 5vw, 57px)', { lineHeight: '1.04', letterSpacing: '-2.4px' }],
        'hero-detail': ['clamp(38px, 6vw, 68px)', { lineHeight: '1.04', letterSpacing: '-2.4px' }],
        'section': ['25px', { letterSpacing: '-0.8px' }],
        'card-title': ['19px', { letterSpacing: '-0.35px' }],
        'body': ['13px', { lineHeight: '1.65' }],
        'detail-body': ['17px', { lineHeight: '1.7' }],
        'eyebrow': ['11px', { letterSpacing: '1.5px' }],
        'pill': ['10px', { letterSpacing: '0.5px' }],
        'stat': ['33px', { letterSpacing: '-1px' }],
        'brand': ['21px', { letterSpacing: '-0.6px' }],
        'nav': ['14px', {}],
        'micro': ['11px', {}],
      },
      maxWidth: {
        'content': '1180px',
        'detail': '1000px',
        'search': '480px',
      },
      borderRadius: {
        'brand': '9px 9px 9px 2px',
        'hero': '8px',
        'card': '6px',
        'panel': '5px',
        'button': '4px',
        'input': '3px',
      },
      boxShadow: {
        'button': '0 4px 0 #d95d3c',
        'button-press': '0 2px 0 #d95d3c',
        'card-hover': '0 10px 25px rgba(25, 50, 74, 0.08)',
        'focus': '0 0 0 3px rgba(11, 119, 113, 0.1)',
      },
      transitionDuration: {
        '180': '180ms',
      },
      spacing: {
        'topbar': '80px',
        'topbar-mobile': '67px',
      },
    },
  },
  plugins: [],
};
```

---

## 11. CSS Variables (For `globals.css`)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');

:root {
  /* Core tokens */
  --ink: #19324a;
  --cream: #f7f8f5;
  --orange: #f0724d;
  --teal: #0b7771;
  --muted: #718293;
  --line: #dfe7e6;

  /* Focus */
  --focus-ring: #e9af48;

  /* Surfaces */
  --hero-bg: #e6f0ec;
  --ai-bg: #fff8ec;
  --admin-bg: #f3f6f5;

  /* Defaults */
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink);
  background: var(--cream);
  font-synthesis: none;
}

* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }

/* Accessible focus ring */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

---

## 12. Implementation Plan

After approval, apply this design system to the new Wingtern monorepo:

### Phase 1: Foundation
1. **Update `apps/web/tailwind.config.js`** with the color, font, spacing, and shadow tokens from §10
2. **Update `apps/web/src/app/globals.css`** with CSS variables and font imports from §11
3. **Add Google Fonts** import for DM Sans, DM Mono, Playfair Display
4. **Update `apps/web/src/app/layout.tsx`** to set meta theme-color to `#102a43`

### Phase 2: Component Restyling
5. **Button component** — Apply 3D bevel shadow, orange background, press feedback
6. **Card component** — White bg, 1px border, 3px colored top, hover lift
7. **Input component** — `#d5e0df` border, teal focus, `3px` radius
8. **Badge component** — DM Mono, uppercase, `10px`, mint bg + teal text
9. **Progress component** — Teal fill on cream track

### Phase 3: Page Updates
10. **Onboarding pages** — Apply ink text, cream canvas, teal accents, hero styling
11. **Home dashboard** — Category-colored cards, stat cards, editorial headlines
12. **Auth pages** — Match the warm editorial tone

### Phase 4: Mobile Alignment
13. **`apps/mobile` NativeWind config** — Same color tokens, font families (DM Sans via Expo Google Fonts)
14. **Mobile components** — Tactile button shadows, card styles translated to RN

---

## 13. Do's and Don'ts

### ✅ Do
- Use `var(--ink)` for all primary text, never generic black
- Use `var(--cream)` as the base canvas, never plain white
- Use DM Mono for all uppercase metadata labels (eyebrows, pills, stats)
- Use Playfair Display *only* inside `<em>` tags in hero headlines
- Give primary CTAs the 3D bevel shadow — it's a signature detail
- Use the `0.18s` transition duration for micro-interactions
- Use the teal focus ring on inputs and the amber focus ring on keyboard navigation
- Color-code categories consistently using the §2.4 palette

### ❌ Don't
- Use Tailwind's default blue/gray/slate colors — this design has its own palette
- Use font-awesome or heavy icon libraries — keep icons light (Lucide or glyphs)
- Add entrance animations, page transitions, or scroll-driven effects — the design is deliberately still
- Use rounded-full on buttons or cards — radii are tight (3–8px)
- Use shadows liberally — only on hover states and the primary CTA bevel
- Use more than one breakpoint — the design is desktop-first with a single `700px` mobile override
