/**
 * App — application shell.
 *
 * T01 scope: a themed, empty shell that proves the toolchain, Tailwind v4
 * tokens and StrictMode mounting all work end-to-end. The screen state machine
 * (`landing | game | paused | help | settings | won | no-moves`), the hooks and
 * the board UI land in T04/T05.
 */
export default function App() {
  return (
    <div className="app-shell flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <span
        className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-gold bg-parchment-2 text-ochre shadow-lg"
        aria-hidden="true"
      >
        <svg viewBox="0 0 100 100" className="h-14 w-14" fill="none" stroke="currentColor"
          strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="26" />
          <circle cx="50" cy="50" r="12" />
        </svg>
      </span>

      <div>
        <h1 className="font-display text-4xl text-ink">
          <span className="text-accent-red">Adinkra</span> Mahjong
        </h1>
        <p className="mt-2 max-w-md text-ink-soft">
          Ghanaian-inspired Mahjong Solitaire. The application shell is ready — game
          screens arrive in the next tasks.
        </p>
      </div>

      <p className="text-xs text-ink-faint">
        Inspired by Ghana&rsquo;s Adinkra visual tradition.
      </p>
    </div>
  );
}
