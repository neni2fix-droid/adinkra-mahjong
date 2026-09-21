/**
 * Adinkra symbol catalogue — the single source of truth for the 34 symbols.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTENT CAVEAT — PLEASE READ
 * The SVG artwork in `src/assets/symbols/` is **hand-drawn line-art created for
 * gameplay**, not historically canonical Adinkra iconography. The `meaning`
 * strings are **reference content** prepared for a future, properly sourced
 * content layer. All symbol content is deliberately isolated to this file and
 * to `src/assets/symbols/*.svg`, so the artwork and text can later be replaced
 * with researched, licensed material **without touching any game logic**.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * At module load this file asserts:
 *   • exactly 34 symbols with unique ids / slugs / names;
 *   • ids form the contiguous range 1..34;
 *   • every `family` is one of the four known families;
 *   • every `slug` matches its asset filename stem;
 *   • every `svgAssetPath` resolves to real inline SVG via the registry;
 *   • every `accessibleLabel` is non-empty.
 * Any violation throws immediately — dev server, build and tests all fail loud.
 *
 * Pure module: no DOM, no React (the registry it consults is build-time only).
 */
import { SYMBOL_COUNT } from '../game/types';
import type { Symbol, SymbolFamily, SymbolId } from '../game/types';
import { SVG_BY_PATH } from './svg-registry';

/** Human-readable names for the four symbol families. */
export const FAMILY_LABELS: Readonly<Record<SymbolFamily, string>> = {
  wisdom: 'Wisdom & Knowledge',
  strength: 'Strength & Courage',
  unity: 'Unity & Relationships',
  life: 'Life & Protection',
};

const ALL_FAMILIES: readonly SymbolFamily[] = ['wisdom', 'strength', 'unity', 'life'];

/** The 34 symbols, ordered by id. */
export const SYMBOLS: readonly Symbol[] = [
  {
    id: 1,
    slug: 'gye-nyame',
    name: 'Gye Nyame',
    family: 'life',
    meaning: 'Supremacy of God; "except for God, nothing exists."',
    svgAssetPath: '../assets/symbols/gye-nyame.svg',
    accessibleLabel: 'Gye Nyame, supremacy of God',
  },
  {
    id: 2,
    slug: 'sankofa',
    name: 'Sankofa',
    family: 'wisdom',
    meaning: '"Go back and fetch it" — learn from the past.',
    svgAssetPath: '../assets/symbols/sankofa.svg',
    accessibleLabel: 'Sankofa, learn from the past',
  },
  {
    id: 3,
    slug: 'adinkrahene',
    name: 'Adinkrahene',
    family: 'wisdom',
    meaning: 'Greatness, leadership, charisma; chief of Adinkra.',
    svgAssetPath: '../assets/symbols/adinkrahene.svg',
    accessibleLabel: 'Adinkrahene, greatness and leadership',
  },
  {
    id: 4,
    slug: 'dwennimmen',
    name: 'Dwennimmen',
    family: 'strength',
    meaning: "Humility together with strength (ram's horns).",
    svgAssetPath: '../assets/symbols/dwennimmen.svg',
    accessibleLabel: 'Dwennimmen, humility with strength',
  },
  {
    id: 5,
    slug: 'akoben',
    name: 'Akoben',
    family: 'strength',
    meaning: 'Vigilance and wariness (the war horn).',
    svgAssetPath: '../assets/symbols/akoben.svg',
    accessibleLabel: 'Akoben, vigilance and wariness',
  },
  {
    id: 6,
    slug: 'akofena',
    name: 'Akofena',
    family: 'strength',
    meaning: 'Courage and valour (ceremonial swords).',
    svgAssetPath: '../assets/symbols/akofena.svg',
    accessibleLabel: 'Akofena, courage and valour',
  },
  {
    id: 7,
    slug: 'akoma',
    name: 'Akoma',
    family: 'unity',
    meaning: 'Patience and tolerance (the heart).',
    svgAssetPath: '../assets/symbols/akoma.svg',
    accessibleLabel: 'Akoma, patience and tolerance',
  },
  {
    id: 8,
    slug: 'akoma-ntoso',
    name: 'Akoma Ntoso',
    family: 'wisdom',
    meaning: '"Linked hearts" — understanding and agreement.',
    svgAssetPath: '../assets/symbols/akoma-ntoso.svg',
    accessibleLabel: 'Akoma Ntoso, linked hearts and understanding',
  },
  {
    id: 9,
    slug: 'ananse-ntontan',
    name: 'Ananse Ntontan',
    family: 'wisdom',
    meaning: "Wisdom and creativity (spider's web).",
    svgAssetPath: '../assets/symbols/ananse-ntontan.svg',
    accessibleLabel: 'Ananse Ntontan, wisdom and creativity',
  },
  {
    id: 10,
    slug: 'asase-ye-duru',
    name: 'Asase Ye Duru',
    family: 'life',
    meaning: 'The Earth has weight; providence and divinity of Earth.',
    svgAssetPath: '../assets/symbols/asase-ye-duru.svg',
    accessibleLabel: 'Asase Ye Duru, the Earth has weight',
  },
  {
    id: 11,
    slug: 'bese-saka',
    name: 'Bese Saka',
    family: 'wisdom',
    meaning: 'Affluence, abundance, unity (sack of cola nuts).',
    svgAssetPath: '../assets/symbols/bese-saka.svg',
    accessibleLabel: 'Bese Saka, affluence and abundance',
  },
  {
    id: 12,
    slug: 'bi-nka-bi',
    name: 'Bi Nka Bi',
    family: 'unity',
    meaning: 'Peace and harmony; "no one should bite another."',
    svgAssetPath: '../assets/symbols/bi-nka-bi.svg',
    accessibleLabel: 'Bi Nka Bi, peace and harmony',
  },
  {
    id: 13,
    slug: 'duafe',
    name: 'Duafe',
    family: 'unity',
    meaning: 'Feminine virtue, care, cleanliness (wooden comb).',
    svgAssetPath: '../assets/symbols/duafe.svg',
    accessibleLabel: 'Duafe, feminine virtue and care',
  },
  {
    id: 14,
    slug: 'eban',
    name: 'Eban',
    family: 'life',
    meaning: 'Security, safety, the home (fence).',
    svgAssetPath: '../assets/symbols/eban.svg',
    accessibleLabel: 'Eban, security and the home',
  },
  {
    id: 15,
    slug: 'fawohodie',
    name: 'Fawohodie',
    family: 'life',
    meaning: 'Independence, freedom, emancipation.',
    svgAssetPath: '../assets/symbols/fawohodie.svg',
    accessibleLabel: 'Fawohodie, independence and freedom',
  },
  {
    id: 16,
    slug: 'fihankra',
    name: 'Fihankra',
    family: 'unity',
    meaning: 'Security and safety (the walled compound).',
    svgAssetPath: '../assets/symbols/fihankra.svg',
    accessibleLabel: 'Fihankra, security and safety',
  },
  {
    id: 17,
    slug: 'hye-won-hye',
    name: 'Hye Won Hye',
    family: 'unity',
    meaning: 'Imperishability and enduring love; "that which burns never burns out."',
    svgAssetPath: '../assets/symbols/hye-won-hye.svg',
    accessibleLabel: 'Hye Won Hye, imperishability and enduring love',
  },
  {
    id: 18,
    slug: 'kuntunkantan',
    name: 'Kuntunkantan',
    family: 'wisdom',
    meaning: 'Extravagance and arrogance (puffed up with pride).',
    svgAssetPath: '../assets/symbols/kuntunkantan.svg',
    accessibleLabel: 'Kuntunkantan, extravagance and arrogance',
  },
  {
    id: 19,
    slug: 'mate-masie',
    name: 'Mate Masie',
    family: 'wisdom',
    meaning: 'Wisdom and knowledge; "I have heard and kept it."',
    svgAssetPath: '../assets/symbols/mate-masie.svg',
    accessibleLabel: 'Mate Masie, wisdom and knowledge',
  },
  {
    id: 20,
    slug: 'mpatapo',
    name: 'Mpatapo',
    family: 'unity',
    meaning: 'Reconciliation, peacemaking, pacification (knot of peace).',
    svgAssetPath: '../assets/symbols/mpatapo.svg',
    accessibleLabel: 'Mpatapo, reconciliation and peacemaking',
  },
  {
    id: 21,
    slug: 'nkyinkyim',
    name: 'Nkyinkyim',
    family: 'wisdom',
    meaning: 'Initiative and dynamism; life is a zigzag.',
    svgAssetPath: '../assets/symbols/nkyinkyim.svg',
    accessibleLabel: 'Nkyinkyim, initiative and dynamism',
  },
  {
    id: 22,
    slug: 'nkonsonkonson',
    name: 'Nkonsonkonson',
    family: 'unity',
    meaning: 'Unity and community (links of a chain).',
    svgAssetPath: '../assets/symbols/nkonsonkonson.svg',
    accessibleLabel: 'Nkonsonkonson, unity and community',
  },
  {
    id: 23,
    slug: 'nsoromma',
    name: 'Nsoromma',
    family: 'life',
    meaning: 'Child of the heavens; God watches over us (star).',
    svgAssetPath: '../assets/symbols/nsoromma.svg',
    accessibleLabel: 'Nsoromma, child of the heavens',
  },
  {
    id: 24,
    slug: 'nyame-dua',
    name: 'Nyame Dua',
    family: 'life',
    meaning: 'Presence and protection of God (altar/tree of God).',
    svgAssetPath: '../assets/symbols/nyame-dua.svg',
    accessibleLabel: 'Nyame Dua, the presence of God',
  },
  {
    id: 25,
    slug: 'nyame-nti',
    name: 'Nyame Nti',
    family: 'life',
    meaning: 'Faith and trust in God; "by God\'s grace we survive."',
    svgAssetPath: '../assets/symbols/nyame-nti.svg',
    accessibleLabel: 'Nyame Nti, faith and trust in God',
  },
  {
    id: 26,
    slug: 'nyansapo',
    name: 'Nyansapo',
    family: 'wisdom',
    meaning: 'Wisdom, ingenuity, intelligence (wisdom knot).',
    svgAssetPath: '../assets/symbols/nyansapo.svg',
    accessibleLabel: 'Nyansapo, the wisdom knot',
  },
  {
    id: 27,
    slug: 'odo-nnyew-fie-kwan',
    name: 'Odo Nnyew Fie Kwan',
    family: 'unity',
    meaning: 'Love never loses its way home.',
    svgAssetPath: '../assets/symbols/odo-nnyew-fie-kwan.svg',
    accessibleLabel: 'Odo Nnyew Fie Kwan, love never loses its way home',
  },
  {
    id: 28,
    slug: 'okodee-mmowere',
    name: 'Okodee Mmowere',
    family: 'strength',
    meaning: "Strength of the talons (the eagle's might).",
    svgAssetPath: '../assets/symbols/okodee-mmowere.svg',
    accessibleLabel: 'Okodee Mmowere, strength of the talons',
  },
  {
    id: 29,
    slug: 'pempamsie',
    name: 'Pempamsie',
    family: 'strength',
    meaning: 'Readiness and steadfastness (chain link).',
    svgAssetPath: '../assets/symbols/pempamsie.svg',
    accessibleLabel: 'Pempamsie, readiness and steadfastness',
  },
  {
    id: 30,
    slug: 'sesa-wo-suban',
    name: 'Sesa Wo Suban',
    family: 'life',
    meaning: 'Transform your life / change your character.',
    svgAssetPath: '../assets/symbols/sesa-wo-suban.svg',
    accessibleLabel: 'Sesa Wo Suban, transform your life',
  },
  {
    id: 31,
    slug: 'tabono',
    name: 'Tabono',
    family: 'strength',
    meaning: 'Strength and perseverance (the oars).',
    svgAssetPath: '../assets/symbols/tabono.svg',
    accessibleLabel: 'Tabono, strength and perseverance',
  },
  {
    id: 32,
    slug: 'wawa-aba',
    name: 'Wawa Aba',
    family: 'strength',
    meaning: 'Hardiness and perseverance (seed of the wawa tree).',
    svgAssetPath: '../assets/symbols/wawa-aba.svg',
    accessibleLabel: 'Wawa Aba, hardiness and perseverance',
  },
  {
    id: 33,
    slug: 'woforo-dua-pa-a',
    name: 'Woforo Dua Pa A',
    family: 'life',
    meaning: 'Support and cooperation; "when you climb a good tree, you are given a push."',
    svgAssetPath: '../assets/symbols/woforo-dua-pa-a.svg',
    accessibleLabel: 'Woforo Dua Pa A, support and cooperation',
  },
  {
    id: 34,
    slug: 'dame-dame',
    name: 'Dame-Dame',
    family: 'strength',
    meaning: 'Intelligence and strategy (checkers/board game).',
    svgAssetPath: '../assets/symbols/dame-dame.svg',
    accessibleLabel: 'Dame-Dame, intelligence and strategy',
  },
];

/** Lookup by id. */
export const SYMBOL_BY_ID: Readonly<Record<SymbolId, Symbol>> = SYMBOLS.reduce<
  Record<SymbolId, Symbol>
>((acc, symbol) => {
  acc[symbol.id] = symbol;
  return acc;
}, {});

/**
 * Look up a symbol by id.
 *
 * @returns The symbol, or `null` when the id is unknown.
 */
export function symbolById(id: SymbolId): Symbol | null {
  return SYMBOL_BY_ID[id] ?? null;
}

/**
 * Validate the catalogue. Runs at module load; throws on the first violation.
 *
 * @internal
 */
function assertSymbolData(symbols: readonly Symbol[]): void {
  if (symbols.length !== SYMBOL_COUNT) {
    throw new Error(
      `[adinkra] expected ${SYMBOL_COUNT} symbols but the catalogue defines ${symbols.length}.`,
    );
  }

  const seenIds = new Set<number>();
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  let minId = Number.POSITIVE_INFINITY;
  let maxId = Number.NEGATIVE_INFINITY;

  for (const symbol of symbols) {
    if (seenIds.has(symbol.id)) {
      throw new Error(`[adinkra] duplicate symbol id ${symbol.id} ("${symbol.name}").`);
    }
    if (seenSlugs.has(symbol.slug)) {
      throw new Error(`[adinkra] duplicate symbol slug "${symbol.slug}".`);
    }
    if (seenNames.has(symbol.name)) {
      throw new Error(`[adinkra] duplicate symbol name "${symbol.name}".`);
    }
    if (!ALL_FAMILIES.includes(symbol.family)) {
      throw new Error(`[adinkra] symbol "${symbol.name}" has unknown family "${symbol.family}".`);
    }

    const fileStem = symbol.svgAssetPath.split('/').pop()?.replace(/\.svg$/, '');
    if (fileStem !== symbol.slug) {
      throw new Error(
        `[adinkra] symbol "${symbol.name}" slug "${symbol.slug}" does not match its asset ` +
          `filename "${fileStem ?? '<none>'}" (they must be identical).`,
      );
    }

    if (!Object.prototype.hasOwnProperty.call(SVG_BY_PATH, symbol.svgAssetPath)) {
      throw new Error(
        `[adinkra] missing SVG asset "${symbol.svgAssetPath}" for symbol "${symbol.name}". ` +
          `Known assets: ${Object.keys(SVG_BY_PATH).sort().join(', ')}`,
      );
    }

    if (symbol.accessibleLabel.trim().length === 0) {
      throw new Error(`[adinkra] symbol "${symbol.name}" has an empty accessibleLabel.`);
    }

    seenIds.add(symbol.id);
    seenSlugs.add(symbol.slug);
    seenNames.add(symbol.name);
    minId = Math.min(minId, symbol.id);
    maxId = Math.max(maxId, symbol.id);
  }

  if (minId !== 1 || maxId !== SYMBOL_COUNT) {
    throw new Error(
      `[adinkra] symbol ids must form the contiguous range 1..${SYMBOL_COUNT}; ` +
        `found ${minId}..${maxId}.`,
    );
  }
}

assertSymbolData(SYMBOLS);
