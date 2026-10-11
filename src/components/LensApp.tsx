"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, LogIn, LogOut, Monitor, Moon, Search, SlidersHorizontal, Sun, ThumbsDown, ThumbsUp, Wand2 } from "lucide-react";
import { useTheme, type ThemePref } from "@/lib/client/theme";
import { useAccess } from "@/lib/client/access";
import { INTERESTS, OTHER_ACCENT, accentFor, labelFor } from "@/lib/interests";
import { CardSchema, type Card, type Mode } from "@/lib/schema";
import { LensError, partialJson, streamLens } from "@/lib/client/stream";
import { logSignal, readSignals, summarize, type SignalSummary } from "@/lib/client/signals";
import { SHOWCASES, type Showcase } from "@/data/showcase";
import { LearningCard } from "./LearningCard";
import { ApiKeyButton } from "./ApiKeyDialog";

interface Current {
  question: string;
  mode: Mode;
  card: Partial<Card>;
  streaming: boolean;
  thinking: string;
  showcase?: Showcase;
  error?: { message: string; code?: string };
  id: number;
}

const load = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

const noopSubscribe = () => () => {};

/** Renders the app only on the client, since all state lives in localStorage. */
export function LensApp() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated ? <LensInner /> : <TopBar />;
}

function LensInner() {
  const [interests, setInterests] = useState<string[]>(() => load<string[]>("lens.interests", []));
  const [customInterest, setCustomInterest] = useState(() => load<string>("lens.custom", ""));
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState("");
  const [current, setCurrent] = useState<Current | null>(null);
  const [feedback, setFeedback] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState<SignalSummary | null>(() => summarize(readSignals()));
  const access = useAccess();
  const abort = useRef<AbortController | null>(null);
  const seq = useRef(0);

  useEffect(() => () => abort.current?.abort(), []);

  const saveInterests = (ids: string[], custom: string) => {
    setInterests(ids);
    setCustomInterest(custom);
    localStorage.setItem("lens.interests", JSON.stringify(ids));
    localStorage.setItem("lens.custom", JSON.stringify(custom));
    setEditing(false);
  };

  const refreshSummary = () => setSummary(summarize(readSignals()));

  const openShowcase = (s: Showcase) => {
    abort.current?.abort();
    const id = ++seq.current;
    setQuestion(s.question);
    setCurrent({ question: s.question, mode: "default", card: s.card, streaming: false, thinking: "", showcase: s, id });
    logSignal({ concept: s.card.concept_title, interest: s.card.chosen_interest, visual: s.card.visual.type, mode: "example", event: "card" });
    refreshSummary();
    window.scrollTo({ top: 0 });
  };

  const explain = useCallback(
    async (q: string, mode: Mode = "default", targetInterest?: string) => {
      const text = q.trim();
      if (text.length < 2) return;
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      const id = ++seq.current;
      const previous =
        current?.card.concept_title && mode !== "default"
          ? {
              chosen_interest: current.card.chosen_interest ?? "",
              analogy_title: current.card.analogy_title ?? "",
              concept_title: current.card.concept_title,
            }
          : undefined;

      // Hand-checked showcase cards answer instantly when they match (PRD §9 demo safety net).
      if (mode === "default") {
        const match = SHOWCASES.find(
          (s) => s.question.toLowerCase() === text.toLowerCase() && interests.includes(s.card.chosen_interest),
        );
        if (match) return openShowcase(match);
      }

      // Visitors with neither the password nor their own key can still browse; new cards need one of them.
      if (access.needsSignIn) {
        setCurrent({ question: text, mode, card: {}, streaming: false, thinking: "", id, error: { message: SIGN_IN_MESSAGE, code: "auth-required" } });
        return;
      }

      setCurrent({ question: text, mode, card: {}, streaming: true, thinking: "", id });
      window.scrollTo({ top: 0 });
      const update = (patch: Partial<Current>) =>
        setCurrent((c) => (c && c.id === id ? { ...c, ...patch } : c));

      try {
        const { text: out } = await streamLens(
          "/api/explain",
          {
            question: text,
            interests: interests.length ? interests : ["cricket"],
            customInterest: customInterest || undefined,
            mode,
            previous,
            targetInterest,
          },
          {
            onText: (full) => {
              const p = partialJson<Card>(full);
              if (p) update({ card: p });
            },
            onThink: (d) =>
              setCurrent((c) => (c && c.id === id ? { ...c, thinking: (c.thinking + d).slice(-220) } : c)),
          },
          controller.signal,
        );
        const json = JSON.parse(out);
        const parsed = CardSchema.safeParse(json);
        const card = (parsed.success ? parsed.data : json) as Card;
        update({ card, streaming: false });
        logSignal({ concept: card.concept_title, interest: card.chosen_interest, visual: card.visual?.type ?? "none", mode, event: "card" });
        refreshSummary();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const e = err instanceof LensError ? err : new LensError((err as Error).message);
        update({ streaming: false, error: { message: e.message, code: e.code } });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current, interests, customInterest, access.needsSignIn],
  );

  const onboarding = editing || interests.length === 0;

  return (
    <>
      <TopBar
        right={
          <>
            {!onboarding && (
              <button className="action-button !px-2.5 !py-2 sm:!px-3.5" aria-label="Edit interests" onClick={() => setEditing(true)}>
                <SlidersHorizontal size={14} /> <span className="hidden sm:inline">Interests</span>
                <span className="hidden gap-0.5 sm:flex">
                  {interests.map((i) => (
                    <span key={i} aria-hidden>
                      {INTERESTS.find((x) => x.id === i)?.glyph ?? "✦"}
                    </span>
                  ))}
                </span>
              </button>
            )}
            <ApiKeyButton />
            {access.signedIn ? (
              <LogoutButton />
            ) : access.signedIn === false ? (
              <Link href="/login" className="action-button !px-2.5 !py-2 sm:!px-3.5">
                <LogIn size={14} /> <span className="hidden sm:inline">Sign in</span>
              </Link>
            ) : null}
          </>
        }
      />
      <main className="mx-auto max-w-[1180px] px-4 pb-20 pt-6 sm:px-6 sm:pt-12">
        {onboarding ? (
          <Onboarding initial={interests} initialCustom={customInterest} onDone={saveInterests} canCancel={interests.length > 0} onCancel={() => setEditing(false)} />
        ) : !current ? (
          <AskHome
            interests={interests}
            customInterest={customInterest}
            question={question}
            setQuestion={setQuestion}
            onAsk={(q) => explain(q)}
            onShowcase={openShowcase}
          />
        ) : (
          <div className="grid gap-9 sm:grid-cols-[minmax(0,1fr)_280px] sm:gap-[60px]">
            <div className="min-w-0">
              <button className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal" onClick={() => { abort.current?.abort(); setCurrent(null); }}>
                <ArrowLeft size={14} /> New question
              </button>
              <p className="mb-4 mt-0 text-[14px] text-muted">
                You asked: <span className="font-semibold text-ink">“{current.question}”</span>
                {current.mode !== "default" && <span className="pill ml-2">{current.mode.replace("_", " ")}</span>}
                {current.showcase && <span className="pill ml-2">Example card</span>}
              </p>
              {current.error ? (
                <ErrorPanel error={current.error} onRetry={() => explain(current.question, current.mode)} />
              ) : (
                <LearningCard
                  key={current.id}
                  card={current.card}
                  streaming={current.streaming}
                  customInterest={customInterest}
                  presetScript={current.showcase?.scene}
                  presetCinematic={current.showcase?.cinematic}
                  onAnswer={(correct) => {
                    logSignal({
                      concept: current.card.concept_title ?? "",
                      interest: current.card.chosen_interest ?? "",
                      visual: current.card.visual?.type ?? "none",
                      mode: current.mode,
                      event: "check",
                      correct,
                    });
                    refreshSummary();
                  }}
                />
              )}
            </div>

            <aside className="grid content-start gap-4 sm:sticky sm:top-[100px] sm:self-start">
              {current.streaming && (
                <div className="ai-panel !p-4" role="status" aria-live="polite">
                  <div className="ai-tag">Lens is thinking</div>
                  <p className="mb-0 mt-2 text-[12px] leading-[1.6] text-ai-secondary">
                    {current.thinking.trim() ? `…${current.thinking.trim()}` : "Choosing the interest that fits the concept's structure…"}
                  </p>
                </div>
              )}

              <AskMini
                question={question}
                setQuestion={setQuestion}
                onAsk={(q) => explain(q)}
                disabled={current.streaming}
              />

              <div className="card !p-5">
                <div className="eyebrow">Not clicking?</div>
                <div className="mt-3 grid gap-2">
                  <ModeButton label="Simpler, please" mode="simpler" current={current} explain={explain} />
                  <ModeButton label="Another analogy" mode="another_analogy" current={current} explain={explain} />
                  <ModeButton label="Go deeper" mode="deeper" current={current} explain={explain} />
                </div>
                {interests.length > 1 && (
                  <>
                    <div className="eyebrow mt-5">Explain it through</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {interests
                        .filter((i) => i !== current.card.chosen_interest)
                        .map((i) => (
                          <button
                            key={i}
                            className="action-button !px-3 !py-2"
                            disabled={current.streaming}
                            style={{ borderTop: `3px solid ${accentFor(i)}` }}
                            onClick={() => explain(current.question, "switch_interest", i === "other" ? customInterest || "other" : i)}
                          >
                            {INTERESTS.find((x) => x.id === i)?.glyph ?? "✦"} {labelFor(i, customInterest)}
                          </button>
                        ))}
                    </div>
                  </>
                )}
              </div>

              {!current.streaming && !current.error && current.card.concept_title && (
                <div className="card !p-5">
                  <div className="eyebrow">Did this click?</div>
                  <div className="mt-3 flex gap-2">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        className={`action-button flex-1 ${feedback[current.id] === v ? "selected" : ""}`}
                        onClick={() => {
                          setFeedback((f) => ({ ...f, [current.id]: v }));
                          logSignal({
                            concept: current.card.concept_title ?? "",
                            interest: current.card.chosen_interest ?? "",
                            visual: current.card.visual?.type ?? "none",
                            mode: current.mode,
                            event: "feedback",
                            clicked: v,
                          });
                          refreshSummary();
                        }}
                      >
                        {v ? <ThumbsUp size={15} /> : <ThumbsDown size={15} />} {v ? "Yes" : "Not yet"}
                      </button>
                    ))}
                  </div>
                  {current.card.next_concept && (
                    <>
                      <div className="eyebrow mt-5">Up next</div>
                      <button
                        className="mt-2 text-left text-[14px] font-bold text-teal"
                        onClick={() => {
                          const q = `What is ${current.card.next_concept}?`;
                          setQuestion(q);
                          explain(q);
                        }}
                      >
                        {current.card.next_concept} ↗
                      </button>
                    </>
                  )}
                </div>
              )}

              {summary && summary.cards > 0 && <SignalsCard summary={summary} customInterest={customInterest} />}
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

/* ---------------- Pieces ---------------- */

export function TopBar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-[67px] items-center justify-between px-4 backdrop-blur-[10px] sm:h-20 sm:px-[max(24px,calc((100vw-1180px)/2))]" style={{ background: "var(--topbar)" }}>
      <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
        <span className="grid h-[29px] w-[29px] place-items-center rounded-brand bg-orange font-[Georgia,serif] text-[17px] font-bold text-white">W</span>
        <span className="whitespace-nowrap text-[18px] font-bold tracking-[-0.6px] sm:text-[21px]">
          wingtern <span className="text-orange">lens</span>
        </span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}

function LogoutButton() {
  return (
    <button
      className="action-button !p-2"
      aria-label="Log out"
      title="Log out"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
        // Full page load on purpose: the proxy must re-run and in-memory state must be dropped.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
      }}
    >
      <LogOut size={15} />
    </button>
  );
}

const THEME_OPTIONS: { pref: ThemePref; label: string; Icon: typeof Sun }[] = [
  { pref: "system", label: "Match system", Icon: Monitor },
  { pref: "light", label: "Light", Icon: Sun },
  { pref: "dark", label: "Dark", Icon: Moon },
];

function ThemeToggle() {
  const { pref, setPref } = useTheme();
  const index = Math.max(0, THEME_OPTIONS.findIndex((o) => o.pref === pref));
  const current = THEME_OPTIONS[index];
  const next = THEME_OPTIONS[(index + 1) % THEME_OPTIONS.length];
  const CurrentIcon = current.Icon;
  return (
    <>
      {/* Phones get one button that cycles through the options, so the top bar fits on narrow screens. */}
      <button
        onClick={() => setPref(next.pref)}
        aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
        title={`Theme: ${current.label}`}
        className="grid h-8 w-8 place-items-center rounded-[4px] border border-btn-border bg-surface text-teal sm:hidden"
      >
        <CurrentIcon size={15} />
      </button>
      <ThemeGroup pref={pref} setPref={setPref} />
    </>
  );
}

function ThemeGroup({ pref, setPref }: { pref: ThemePref; setPref: (p: ThemePref) => void }) {
  return (
    <div role="group" aria-label="Theme" className="hidden rounded-[4px] border border-btn-border bg-surface p-0.5 sm:flex">
      {THEME_OPTIONS.map(({ pref: p, label, Icon }) => (
        <button
          key={p}
          onClick={() => setPref(p)}
          aria-pressed={pref === p}
          aria-label={label}
          title={label}
          className={`grid h-7 w-7 place-items-center rounded-[3px] sm:h-8 sm:w-8 ${pref === p ? "bg-teal-light text-teal" : "text-muted"}`}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}

export function Hero({ children }: { children: React.ReactNode }) {
  return (
    <section className="hero px-6 py-10 sm:px-[42px] sm:py-12">
      <div className="orbit" style={{ width: 420, height: 160, right: -90, top: 40, opacity: 0.18, transform: "rotate(-14deg)" }} />
      <div className="orbit" style={{ width: 300, height: 110, right: -20, top: 70, opacity: 0.28, transform: "rotate(-14deg)" }} />
      <span className="pointer-events-none absolute right-[16%] top-[22%] hidden text-[20px] text-orange sm:block">✦</span>
      <span className="pointer-events-none absolute right-[7%] top-[60%] hidden text-[18px] text-teal sm:block">↗</span>
      <span className="pointer-events-none absolute right-[24%] top-[74%] hidden text-[22px] text-hero-gold sm:block">•</span>
      <div className="relative max-w-[720px]">{children}</div>
    </section>
  );
}

export function HeroTitle() {
  return (
    <>
      <div className="eyebrow">Wingtern Lens</div>
      <h1 className="mb-0 mt-3 text-[clamp(34px,5vw,57px)] font-bold leading-[1.04] tracking-[-2.4px]">
        Learn anything through what you <em className="font-serif font-semibold italic text-orange">love</em>.
      </h1>
    </>
  );
}

function Onboarding({
  initial,
  initialCustom,
  onDone,
  canCancel,
  onCancel,
}: {
  initial: string[];
  initialCustom: string;
  onDone: (ids: string[], custom: string) => void;
  canCancel: boolean;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [custom, setCustom] = useState(initialCustom);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));
  const hasOther = picked.includes("other");
  const valid = picked.length > 0 && (!hasOther || custom.trim().length > 1);

  return (
    <div className="grid gap-8">
      <Hero>
        <HeroTitle />
        <p className="mb-0 mt-4 max-w-[560px] text-[15px] leading-[1.65] text-hero-copy">
          Pick up to three things you&apos;re into. Lens will explain concepts like binary search, compound interest or inflation through them, with
          structural analogies, visuals and an honest note on where each analogy breaks.
        </p>
      </Hero>

      <section>
        <div className="eyebrow">Step 1 · Your interests</div>
        <h2 className="mb-0 mt-2 text-[25px] font-bold tracking-[-0.8px]">What do you love?</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {INTERESTS.map((i) => (
            <button
              key={i.id}
              onClick={() => toggle(i.id)}
              aria-pressed={picked.includes(i.id)}
              className={`action-button card-lift h-[104px] flex-col !items-start !justify-between !p-4 ${picked.includes(i.id) ? "selected" : ""}`}
              style={{ borderTop: `3px solid ${i.accent}` }}
            >
              <span className="text-[26px] leading-none">{i.glyph}</span>
              <span className="text-[15px] text-ink">{i.label}</span>
            </button>
          ))}
          <button
            onClick={() => toggle("other")}
            aria-pressed={hasOther}
            className={`action-button card-lift h-[104px] flex-col !items-start !justify-between !p-4 ${hasOther ? "selected" : ""}`}
            style={{ borderTop: `3px solid ${OTHER_ACCENT}` }}
          >
            <span className="text-[24px] leading-none text-orange">✦</span>
            <span className="text-[15px] text-ink">Something else</span>
          </button>
        </div>
        {hasOther && (
          <div className="mt-4 max-w-[480px]">
            <label className="text-[13px] font-bold" htmlFor="custom-interest">
              Describe it
            </label>
            <input
              id="custom-interest"
              className="field-input mt-1.5"
              placeholder="e.g. Taylor Swift eras, Minecraft redstone, K-pop"
              maxLength={60}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </div>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button className="primary-button" disabled={!valid} onClick={() => onDone(picked, hasOther ? custom.trim() : "")}>
            Start learning <span aria-hidden>→</span>
          </button>
          {canCancel && (
            <button className="text-[13px] font-bold text-muted" onClick={onCancel}>
              Cancel
            </button>
          )}
          <span className="font-mono text-[10px] uppercase tracking-[0.5px] text-muted">{picked.length}/3 selected</span>
        </div>
      </section>
    </div>
  );
}

function AskHome({
  interests,
  customInterest,
  question,
  setQuestion,
  onAsk,
  onShowcase,
}: {
  interests: string[];
  customInterest: string;
  question: string;
  setQuestion: (q: string) => void;
  onAsk: (q: string) => void;
  onShowcase: (s: Showcase) => void;
}) {
  const starters = Array.from(new Set(interests.flatMap((i) => INTERESTS.find((x) => x.id === i)?.starters ?? []))).slice(0, 6);
  return (
    <div className="grid gap-10">
      <Hero>
        <HeroTitle />
        <p className="mb-5 mt-4 text-[15px] text-hero-copy">
          Ask about code, maths, money or anything else. Lens answers through{" "}
          <strong className="text-ink">{interests.map((i) => labelFor(i, customInterest)).join(", ")}</strong>.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAsk(question);
          }}
          className="search-wrap max-w-[640px]"
        >
          <Search size={18} className="shrink-0 text-muted" />
          <input
            autoFocus
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What do you want to understand?"
            maxLength={500}
            aria-label="Your question"
          />
          <button className="primary-button !py-2.5" disabled={question.trim().length < 2}>
            <Wand2 size={15} /> Explain
          </button>
        </form>
      </Hero>

      <section>
        <div className="eyebrow">Try asking</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {starters.map((s) => (
            <button key={s} className="action-button !py-2.5" onClick={() => { setQuestion(s); onAsk(s); }}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Example cards</div>
            <h2 className="mb-0 mt-2 text-[25px] font-bold tracking-[-0.8px]">See what a Lens card looks like</h2>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.5px] text-muted sm:block">Hand-checked · instant</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SHOWCASES.map((s) => {
            const accent = accentFor(s.card.chosen_interest);
            return (
              <button key={s.id} onClick={() => onShowcase(s)} className="card card-lift min-h-[190px] text-left" style={{ borderTopColor: accent }}>
                <div className="flex items-center justify-between">
                  <span className="pill">{s.domain}</span>
                  <span className="text-[18px]">{INTERESTS.find((i) => i.id === s.card.chosen_interest)?.glyph}</span>
                </div>
                <h3 className="mb-0 mt-4 text-[19px] font-bold tracking-[-0.35px] text-ink">{s.card.concept_title}</h3>
                <p className="mb-0 mt-1.5 text-[13px] leading-[1.65] text-muted">{s.card.analogy_title}</p>
                <span className="mt-4 inline-block text-[13px] font-bold text-teal">Open card ↗</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function AskMini({
  question,
  setQuestion,
  onAsk,
  disabled,
}: {
  question: string;
  setQuestion: (q: string) => void;
  onAsk: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <form
      className="card !p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onAsk(question);
      }}
    >
      <label className="eyebrow" htmlFor="ask-mini">
        Ask something else
      </label>
      <textarea
        id="ask-mini"
        rows={2}
        className="field-input mt-3 resize-none"
        value={question}
        maxLength={500}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onAsk(question);
          }
        }}
        placeholder="Another question…"
      />
      <button className="primary-button mt-3 w-full !py-2.5" disabled={disabled || question.trim().length < 2}>
        <Wand2 size={15} /> Explain
      </button>
    </form>
  );
}

function ModeButton({
  label,
  mode,
  current,
  explain,
}: {
  label: string;
  mode: Mode;
  current: Current;
  explain: (q: string, m: Mode) => void;
}) {
  return (
    <button
      className={`action-button w-full !justify-start ${current.mode === mode ? "selected" : ""}`}
      disabled={current.streaming}
      onClick={() => explain(current.question, mode)}
    >
      {label}
    </button>
  );
}

const SIGN_IN_MESSAGE = "Sign in with the access password, or add your own API key, to generate new cards.";

function ErrorPanel({ error, onRetry }: { error: { message: string; code?: string }; onRetry: () => void }) {
  if (error.code === "auth-required") {
    return (
      <div className="empty-state !text-left">
        <div className="text-[22px] text-orange">✦</div>
        <h3 className="mb-0 mt-2 text-[19px] font-bold">Sign in to generate your own</h3>
        <p className="mb-0 mt-2 text-[14px] text-muted">
          The example cards and their animations are open to everyone. New questions use Claude, so they need the access password or your own
          Anthropic API key.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="primary-button" onClick={() => window.dispatchEvent(new Event("lens:open-key"))}>
            <KeyRound size={15} /> Use my API key
          </button>
          <Link href="/login" className="action-button">
            <LogIn size={15} /> Log in with password
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="empty-state !text-left">
      <div className="text-[22px] text-orange">✦</div>
      <h3 className="mb-0 mt-2 text-[19px] font-bold">Lens hit a snag</h3>
      <p className="mb-0 mt-2 text-[14px] text-muted">{error.message}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="primary-button"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
      {(error.code === "auth" || error.code === "limit" || error.code === "rate") && (
        <p className="mb-0 mt-4 text-[12px] text-muted">The example cards on the home screen still work offline.</p>
      )}
    </div>
  );
}

function SignalsCard({ summary, customInterest }: { summary: SignalSummary; customInterest: string }) {
  const rows = Object.entries(summary.byInterest).filter(([k]) => k);
  return (
    <div className="card !p-5">
      <div className="eyebrow">Your learning signals</div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat n={summary.cards} label="cards" />
        <Stat n={summary.checks ? Math.round((summary.correct / summary.checks) * 100) : 0} label="% correct" />
        <Stat n={summary.clicked} label="clicked" />
      </div>
      {rows.length > 0 && (
        <div className="mt-4 grid gap-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between text-[12px]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: accentFor(k) }} />
                {labelFor(k, customInterest)}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {v.cards} cards · {v.checks ? `${v.correct}/${v.checks}` : "0/0"} right
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mb-0 mt-3 text-[11px] leading-[1.5] text-muted">
        Stored only on this device. In Wingtern, this is how Lens will learn which explanations work for you.
      </p>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-[3px] bg-surface-2 py-2">
      <div className="text-[22px] font-bold tracking-[-1px]">{n}</div>
      <div className="font-mono text-[9px] uppercase tracking-[0.5px] text-muted">{label}</div>
    </div>
  );
}
