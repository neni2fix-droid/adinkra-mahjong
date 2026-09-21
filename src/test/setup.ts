/**
 * Vitest global setup.
 *
 * Registers the jest-dom matchers (`toBeInTheDocument`, `toHaveAttribute`, …)
 * so component suites read naturally. Referenced from `vite.config.ts` via
 * `test.setupFiles`.
 */
import '@testing-library/jest-dom';
