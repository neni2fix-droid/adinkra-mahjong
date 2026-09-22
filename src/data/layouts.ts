/**
 * Board layouts — four hand-designed grids, each summing to exactly 136 tiles.
 *
 * Construction rules (architecture §4.1):
 *  • Every position is an **integer** grid coordinate `{ x, y, layer }` — no
 *    half-tile offsets, which keeps the blocking rule exact.
 *  • Grid origin is top-left: `x` = column, `y` = row, `layer` = 0 (base) up.
 *  • Each upper layer's footprint nests inside the layer below, so upper tiles
 *    genuinely cover lower ones.
 *  • `assertTileCount` runs at module load — a layout that is not 136 tiles
 *    throws immediately rather than shipping a broken board.
 *
 * Pure module: no DOM, no React, no `window`.
 */
import { TILE_COUNT } from '../game/types';
import type { BoardPosition, Difficulty, LayoutDefinition, LayoutId } from '../game/types';

/** One layer of a layout: either a solid rectangle block or a row-pattern. */
type LayerDef =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'rows'; rows: readonly string[]; x?: number; y?: number };

/**
 * Build a rectangular block of positions.
 *
 * @param x0 Left column (inclusive).
 * @param y0 Top row (inclusive).
 * @param w  Width in columns.
 * @param h  Height in rows.
 * @param layer Layer index.
 */
export function rect(
  x0: number,
  y0: number,
  w: number,
  h: number,
  layer: number,
): BoardPosition[] {
  const out: BoardPosition[] = [];
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      out.push({ x, y, layer });
    }
  }
  return out;
}

/**
 * Build positions from row strings, where `'1'` marks a tile and `'0'` empty.
 *
 * @param rows    Row strings, top row first.
 * @param layer   Layer index applied to every produced position.
 * @param offsetX Column offset added to each row index.
 * @param offsetY Row offset added to each row index.
 */
export function fromRows(
  rows: readonly string[],
  layer: number,
  offsetX = 0,
  offsetY = 0,
): BoardPosition[] {
  const out: BoardPosition[] = [];
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      if (row.charAt(rx) === '1') {
        out.push({ x: offsetX + rx, y: offsetY + ry, layer });
      }
    }
  });
  return out;
}

/**
 * Assert a layout holds exactly `expected` tiles.
 *
 * @throws If the position count or the cached `tileCount` disagrees.
 */
export function assertTileCount(layout: LayoutDefinition, expected: number): void {
  const actual = layout.positions.length;
  if (actual !== expected) {
    throw new Error(
      `[adinkra] layout "${layout.id}" defines ${actual} tiles; expected ${expected}.`,
    );
  }
  if (layout.tileCount !== actual) {
    throw new Error(
      `[adinkra] layout "${layout.id}" caches tileCount ${layout.tileCount} but has ${actual} positions.`,
    );
  }
}

/** Assemble a named layout from per-layer definitions, asserting the total. */
function makeLayout(
  id: LayoutId,
  name: string,
  blurb: string,
  difficulty: Difficulty,
  cols: number,
  rows: number,
  layerDefs: readonly LayerDef[],
): LayoutDefinition {
  const positions: BoardPosition[] = [];
  layerDefs.forEach((def, layer) => {
    if (def.kind === 'rect') {
      positions.push(...rect(def.x, def.y, def.w, def.h, layer));
    } else {
      positions.push(...fromRows(def.rows, layer, def.x ?? 0, def.y ?? 0));
    }
  });

  const layout: LayoutDefinition = {
    id,
    name,
    blurb,
    difficulty,
    cols,
    rows,
    layers: layerDefs.length,
    maxLayer: layerDefs.length - 1,
    positions,
    tileCount: positions.length,
  };

  assertTileCount(layout, TILE_COUNT);
  return layout;
}

/* ---------------------------------------------------------------------- *
 * Layout 1 — Classic Turtle · grid 12 × 8 · 92 + 28 + 16 = 136
 * ---------------------------------------------------------------------- */
const CLASSIC_TURTLE = makeLayout('classic-turtle', 'Classic Turtle', 'Wide base, generous margins — the gentlest board.', 1, 12, 8, [
  {
    kind: 'rows',
    rows: [
      '111111111111', // y0  12
      '111111111111', // y1  12
      '111111111111', // y2  12
      '011111111110', // y3  10
      '011111111110', // y4  10
      '111111111111', // y5  12
      '111111111111', // y6  12
      '111111111111', // y7  12
    ],
  }, // = 92
  {
    kind: 'rows',
    rows: [
      '011110', // y1  4
      '111111', // y2  6
      '111111', // y3  6
      '111111', // y4  6
      '111111', // y5  6
    ],
    x: 3,
    y: 1,
  }, // = 28
  { kind: 'rect', x: 4, y: 2, w: 4, h: 4 }, // = 16
]);

/* ---------------------------------------------------------------------- *
 * Layout 2 — Diamond · grid 12 × 12 · 84 + 36 + 16 = 136
 * ---------------------------------------------------------------------- */
const DIAMOND = makeLayout('diamond', 'Diamond', 'Tapering rim; freedom tightens at the four points.', 2, 12, 12, [
  {
    kind: 'rows',
    rows: [
      '000001100000', // y0   2
      '000011110000', // y1   4
      '000111111000', // y2   6
      '001111111100', // y3   8
      '011111111110', // y4  10
      '111111111111', // y5  12
      '111111111111', // y6  12
      '011111111110', // y7  10
      '001111111100', // y8   8
      '000111111000', // y9   6
      '000011110000', // y10  4
      '000001100000', // y11  2
    ],
  }, // = 84
  { kind: 'rect', x: 3, y: 3, w: 6, h: 6 }, // = 36
  { kind: 'rect', x: 4, y: 4, w: 4, h: 4 }, // = 16
]);

/* ---------------------------------------------------------------------- *
 * Layout 3 — Ghana Star · grid 12 × 12 · 72 + 48 + 16 = 136
 * ---------------------------------------------------------------------- */
const GHANA_STAR = makeLayout('ghana-star', 'Ghana Star', 'Pinched star points create tight corridors.', 4, 12, 12, [
  {
    kind: 'rows',
    rows: [
      '000001100000', // y0   2
      '000011110000', // y1   4
      '000001100000', // y2   2  ← pinch
      '000111111000', // y3   6
      '011111111110', // y4  10
      '111111111111', // y5  12  ← E/W points
      '111111111111', // y6  12
      '011111111110', // y7  10
      '000111111000', // y8   6
      '000001100000', // y9   2  ← pinch
      '000011110000', // y10  4
      '000001100000', // y11  2
    ],
  }, // = 72
  {
    kind: 'rows',
    rows: [
      '000001100000', // y2   2
      '000011110000', // y3   4
      '001111111100', // y4   8
      '011111111110', // y5  10
      '011111111110', // y6  10
      '001111111100', // y7   8
      '000011110000', // y8   4
      '000001100000', // y9   2
    ],
    x: 0,
    y: 2,
  }, // = 48
  { kind: 'rect', x: 4, y: 4, w: 4, h: 4 }, // = 16
]);

/* ---------------------------------------------------------------------- *
 * Layout 4 — Compact Mobile · grid 8 × 12 (portrait) · 88 + 36 + 12 = 136
 * ---------------------------------------------------------------------- */
const COMPACT_MOBILE = makeLayout('compact-mobile', 'Compact Mobile', 'Narrow 8-wide body tuned for one-hand play.', 3, 8, 12, [
  { kind: 'rect', x: 0, y: 0, w: 8, h: 11 }, // = 88
  { kind: 'rect', x: 1, y: 2, w: 6, h: 6 }, // = 36
  { kind: 'rect', x: 2, y: 4, w: 4, h: 3 }, // = 12
]);

/** Every shipped layout, in presentation order. */
export const LAYOUTS: readonly LayoutDefinition[] = [
  CLASSIC_TURTLE,
  DIAMOND,
  GHANA_STAR,
  COMPACT_MOBILE,
];

/** Lookup by id. */
export const LAYOUT_BY_ID: Readonly<Record<LayoutId, LayoutDefinition>> = {
  'classic-turtle': CLASSIC_TURTLE,
  diamond: DIAMOND,
  'ghana-star': GHANA_STAR,
  'compact-mobile': COMPACT_MOBILE,
};

/** The layout a fresh game starts on. */
export const DEFAULT_LAYOUT_ID: LayoutId = 'classic-turtle';

/**
 * Resolve a layout by id, falling back to the default for unrecognised values
 * (e.g. a stale id restored from storage) instead of crashing the app.
 */
export function layoutById(id: LayoutId): LayoutDefinition {
  return LAYOUT_BY_ID[id] ?? LAYOUT_BY_ID[DEFAULT_LAYOUT_ID];
}
