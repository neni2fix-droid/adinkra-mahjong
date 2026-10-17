# Adinkra Mahjong

> **Inspired by Ghana's Adinkra visual tradition.**
> Design & Engineering: Nenifix

A production-ready, browser-based **Mahjong Solitaire** game themed on the
Adinkra symbols of Ghana. 34 curated symbols × 4 copies = **136 tiles**.
Pure client-side SPA — no backend, no accounts, no network calls at runtime.

> **Status: playable.** The full game ships — the pure game core (rules, solvable
> dealing, scoring, undo, persistence) and the React UI (board, toolbar, stats,
> modals, Help & Settings) are complete and covered by the Vitest suite. See
> `docs/architecture.md` §14 for the task list and `docs/game-design.md` for the
> balance design.

---

## Quick start

```bash
# 1. Install (the project-local .npmrc already redirects the npm cache away
#    from the full D: drive — see "Disk constraints" below)
npm install

# 2. Develop
npm run dev

# 3. Verify
npm run build     # tsc -b && vite build
npm test          # vitest run
npm run lint      # eslint .
```

### Disk constraints (important on this machine)

The user's global `~/.npmrc` points `cache`/`prefix` at `D:\os9\...` and **`D:`
is 100 % full**, so a plain `npm install` dies with `ENOSPC`. Two mitigations
are in place:

1. **Project-local `.npmrc`** (committed) sets
   `cache=C:/Users/ai9/.workbuddy-ai/cache/npm`, so plain `npm install` works.
2. The explicit form, for CI / QA:

   ```bash
   npm install --cache "C:/Users/ai9/.workbuddy-ai/cache/npm"
   ```

The project deliberately adds **zero** runtime dependencies beyond React and
ships **zero binary assets** — artwork is inline SVG, audio is synthesized with
the Web Audio API, and the PWA icons are SVG rather than PNG.

---

## Tech stack

| Concern | Choice |
|---------|--------|
| Build | Vite 7 (`base: './'` — portable static hosting) |
| UI | React 19 + `StrictMode` (client SPA only) |
| Language | TypeScript 5.9, `strict: true`, project references |
| Styling | Tailwind CSS 4 — **CSS-first** (`@import "tailwindcss"` + `@theme`; no `tailwind.config.js`) |
| Tests | Vitest 3 + jsdom + Testing Library |
| Lint | ESLint 9 flat config |

### Node runtime note

Node **24.14.1** lives at `C:\Program Files\nodejs\node.exe`. A bare `node` on
`PATH` may resolve to a different (v22) runtime, so drive the toolchain through
the npm scripts. For a direct CLI check use the absolute path:

```bash
"C:/Program Files/nodejs/node.exe" node_modules/vitest/vitest.mjs run
```

---

## Architecture in one paragraph

**Pure core + thin React shell.** All game rules, dealing, scoring, undo,
persistence serialization and audio synthesis live in framework-free TypeScript
under `src/game/**` and `src/data/**` — no React, no DOM, no `localStorage`.
React (`src/hooks/**`, `src/components/**`, `App.tsx`) owns rendering, effects,
focus and DOM events only. Browser automation is unavailable on this Windows
host, so Vitest is the only verification channel — which is exactly why the
pure core is deliberately large and the React layer thin.

---

## File map

```
adinkra-mahjong/
├── index.html                     # app shell + meta/OG/PWA links
├── vite.config.ts                 # Vite + Vitest config (single file)
├── tsconfig.json                  # solution file (project references)
├── tsconfig.app.json              # strict, src/
├── tsconfig.node.json             # vite.config.ts
├── eslint.config.js               # flat ESLint 9
├── public/                        # manifest, SVG icons, robots.txt
├── docs/architecture.md           # the authoritative design document
└── src/
    ├── main.tsx                   # createRoot + StrictMode
    ├── App.tsx                    # screen state machine + wiring
    ├── styles/index.css           # Tailwind v4 entry + @theme tokens
    ├── test/setup.ts              # jest-dom matchers
    ├── assets/symbols/*.svg       # 34 Adinkra symbols, one file each
    ├── data/                      # ── pure ──
    │   ├── symbols.ts             # the 34 symbol records + load-time assertions
    │   ├── layouts.ts             # four 136-tile layouts + assertTileCount
    │   └── svg-registry.ts        # ?raw glob registry + getSymbolSvg()
    └── game/                      # ── pure ──
        └── types.ts               # core interfaces + tuning constants
```

---

## Layouts

Four hand-designed boards, each asserted `=== 136` at module load. All
positions sit on an integer grid (no half-tile offsets), so the blocking rule is
exact.

| Layout | Grid | Layers | Per-layer counts | Total |
|--------|------|--------|------------------|-------|
| Classic Turtle | 12 × 8 | 3 | 92 / 28 / 16 | **136** |
| Diamond | 12 × 12 | 3 | 84 / 36 / 16 | **136** |
| Ghana Star | 12 × 12 | 3 | 72 / 48 / 16 | **136** |
| Compact Mobile | 8 × 12 | 3 | 88 / 36 / 12 | **136** |

---

## The 34 Adinkra symbols

Family legend: **W** Wisdom & Knowledge · **S** Strength & Courage ·
**U** Unity & Relationships · **L** Life & Protection.

| # | Symbol | Family | Meaning |
|---|--------|--------|---------|
| 1 | Gye Nyame | L | Supremacy of God; "except for God, nothing exists." |
| 2 | Sankofa | W | "Go back and fetch it" — learn from the past. |
| 3 | Adinkrahene | W | Greatness, leadership, charisma; chief of Adinkra. |
| 4 | Dwennimmen | S | Humility together with strength (ram's horns). |
| 5 | Akoben | S | Vigilance and wariness (the war horn). |
| 6 | Akofena | S | Courage and valour (ceremonial swords). |
| 7 | Akoma | U | Patience and tolerance (the heart). |
| 8 | Akoma Ntoso | W | "Linked hearts" — understanding and agreement. |
| 9 | Ananse Ntontan | W | Wisdom and creativity (spider's web). |
| 10 | Asase Ye Duru | L | The Earth has weight; providence and divinity of Earth. |
| 11 | Bese Saka | W | Affluence, abundance, unity (sack of cola nuts). |
| 12 | Bi Nka Bi | U | Peace and harmony; "no one should bite another." |
| 13 | Duafe | U | Feminine virtue, care, cleanliness (wooden comb). |
| 14 | Eban | L | Security, safety, the home (fence). |
| 15 | Fawohodie | L | Independence, freedom, emancipation. |
| 16 | Fihankra | U | Security and safety (the walled compound). |
| 17 | Hye Won Hye | U | Imperishability and enduring love. |
| 18 | Kuntunkantan | W | Extravagance and arrogance (puffed up with pride). |
| 19 | Mate Masie | W | Wisdom and knowledge; "I have heard and kept it." |
| 20 | Mpatapo | U | Reconciliation, peacemaking, pacification (knot of peace). |
| 21 | Nkyinkyim | W | Initiative and dynamism; life is a zigzag. |
| 22 | Nkonsonkonson | U | Unity and community (links of a chain). |
| 23 | Nsoromma | L | Child of the heavens; God watches over us (star). |
| 24 | Nyame Dua | L | Presence and protection of God (altar/tree of God). |
| 25 | Nyame Nti | L | Faith and trust in God; "by God's grace we survive." |
| 26 | Nyansapo | W | Wisdom, ingenuity, intelligence (wisdom knot). |
| 27 | Odo Nnyew Fie Kwan | U | Love never loses its way home. |
| 28 | Okodee Mmowere | S | Strength of the talons (the eagle's might). |
| 29 | Pempamsie | S | Readiness and steadfastness (chain link). |
| 30 | Sesa Wo Suban | L | Transform your life / change your character. |
| 31 | Tabono | S | Strength and perseverance (the oars). |
| 32 | Wawa Aba | S | Hardiness and perseverance (seed of the wawa tree). |
| 33 | Woforo Dua Pa A | L | Support and cooperation; "when you climb a good tree, you are given a push." |
| 34 | Dame-Dame | S | Intelligence and strategy (checkers/board game). |

Family balance: **W 9 · S 8 · U 8 · L 9 = 34**.

---

## Content caveat

The SVG artwork in `src/assets/symbols/` is **hand-drawn line-art created for
gameplay**, not historically canonical Adinkra iconography, and the `meaning`
strings are **reference content** prepared for a future, properly sourced
content layer. All symbol content is isolated to `src/data/symbols.ts` and
`src/assets/symbols/*.svg`, so it can later be replaced with researched,
licensed vector artwork **without touching any game logic**.

---

## Attribution

- **Inspired by Ghana's Adinkra visual tradition.**
- Design & Engineering: **Nenifix**
