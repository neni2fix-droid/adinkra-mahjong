/**
 * Visually-hidden aria-live regions for screen-reader announcements.
 */
export default function LiveRegion({ polite, assertive }: { polite: string; assertive: string }) {
  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </>
  );
}
