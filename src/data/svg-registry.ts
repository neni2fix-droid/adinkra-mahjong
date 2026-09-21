/**
 * SVG asset registry — build-time inlining via `?raw` (architecture §2.5).
 *
 * Every symbol is a dedicated `.svg` file on disk (satisfying the "one file per
 * symbol" requirement) which Vite inlines into the JS bundle as a raw string.
 * That gives us, simultaneously:
 *   • dedicated files on disk (authorable / replaceable artwork),
 *   • zero extra HTTP requests at runtime (mobile-friendly),
 *   • no possibility of a silent runtime 404 — a missing file is a build error,
 *   • `stroke="currentColor"` artwork, so the theme drives the colour.
 *
 * This module is Vite-only (it uses `import.meta.glob`); it is never executed by
 * plain Node. `symbols.ts` consumes it purely to *assert* that every authored
 * path resolves, so a typo fails loudly at module load.
 */

const modules = import.meta.glob('../assets/symbols/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Raw SVG source keyed by its literal import specifier, e.g. `'../assets/symbols/gye-nyame.svg'`. */
export const SVG_BY_PATH: Readonly<Record<string, string>> = modules;

/** The number of SVG files discovered on disk. */
export const SVG_ASSET_COUNT = Object.keys(modules).length;

/**
 * Resolve the raw markup for a symbol asset.
 *
 * @param assetPath Literal relative specifier, e.g. `'../assets/symbols/gye-nyame.svg'`.
 * @returns The complete `<svg …>…</svg>` document as a string.
 * @throws If no asset was registered for that path (fail loud, never 404).
 */
export function getSymbolSvg(assetPath: string): string {
  const svg = SVG_BY_PATH[assetPath];
  if (typeof svg !== 'string') {
    throw new Error(
      `[adinkra] SVG asset not found for path "${assetPath}". ` +
        `Known assets: ${Object.keys(SVG_BY_PATH).sort().join(', ')}`,
    );
  }
  return svg;
}
