# Pre-Viz Engine v1.9.0 — QA Automation Suite

Playwright test suite for [Pre-Viz Engine](https://previz-engine-m1mm9ayva-valid.vercel.app/), an AI video generation tool powered by OpenAI's Sora API.

## Setup

```bash
pnpm install
npx playwright install --with-deps
```

## Running Tests

```bash
pnpm test                 # all tests
pnpm test:smoke           # smoke tests only
pnpm test:ui              # UI tests only
pnpm test:api             # API tests only
pnpm test:regression      # release-gate suite (core flows + bug validations)
pnpm test:a11y            # accessibility scans (axe-core WCAG 2.1 AA)
pnpm test:visual          # visual regression (screenshot comparison)
pnpm test:visual:update   # update visual regression baselines
pnpm test:security        # security header and cookie audits
pnpm report               # open HTML report
pnpm allure:generate      # generate Allure report from results
pnpm allure:open          # open Allure report in browser
pnpm lint                 # ESLint
```

## Project Structure

```
tests/
  fixtures.ts             # Playwright custom fixtures (POM injection)
  data/
    fixtures.ts           # Test data (prompts, screenplays, endpoints, edge cases)
    index.ts              # Barrel export
  pages/
    navigation.page.ts    # Navigation POM
    studio.page.ts        # Studio page POM (form, generation, mocking)
    stock-footage.page.ts # Stock Footage page POM (script parsing)
    history.page.ts       # History page POM (tabs, video cards)
    index.ts              # Barrel export
  ui/
    navigation.spec.ts    # Navigation smoke tests
    studio.spec.ts        # Studio form + generation trigger + BUG-007
    stock-footage.spec.ts # Script parsing flow tests
    stock-footage-edge.spec.ts  # Script parsing edge cases (unicode, malformed, etc.)
    history.spec.ts       # Video history browsing and playback
    mobile.spec.ts        # Mobile viewport responsive bugs (BUG-009)
  api/
    generation-pipeline.spec.ts  # API contracts + BUG-001/002/004
    negative-paths.spec.ts       # API error handling + network failures
    prompt-edge-cases.spec.ts    # SQL injection, XSS, unicode, long prompts
    security-headers.spec.ts     # CSP, HSTS, cookie flags audit
  a11y/
    page-scans.spec.ts    # axe-core WCAG 2.1 AA scans per page
  visual/
    page-snapshots.spec.ts # Visual regression baselines
  __screenshots__/         # Visual regression baseline images
deliverables/
  qa-report.md            # Full QA report, bug pack, Claude Code usage
```

## Architecture Decisions

**Generation trigger, not completion.** Videos take ~5 minutes to generate via Sora. Tests verify the trigger point (prompt submission, API response, rendering state transition) and API contracts independently. This makes the suite CI-feasible without long timeouts.

**Mocked generation flow.** Studio generation tests use `page.route()` to mock `/api/generate-video` and `/api/video-status` responses. Mock shapes match the real API (discovered via live browser evaluation). This avoids hitting the Sora API and burning credits during test runs.

**Real AI calls for script parsing.** Stock Footage parsing tests hit the real AI endpoint (~10s response time) since the output quality matters and can't be meaningfully mocked. These tests have a 60s timeout.

**test.fail() for known bugs.** Bug regression tests assert the *correct* behavior and are marked with `test.fail(true, 'BUG-XXX: description')`. When a bug is fixed, the test will unexpectedly pass — flipping it to a failure that signals the `test.fail` annotation should be removed.

## Test Matrix

| Area | Tests | Tags |
|------|-------|------|
| Navigation | 5 | @smoke @ui |
| Studio Form + Generation | 10 | @smoke @ui @regression |
| Stock Footage Form + Parsing | 8 | @smoke @ui |
| Stock Footage Edge Cases | 8 | @ui |
| History | 8 | @smoke @ui |
| Mobile Viewport | 4 | @regression @ui |
| API Pipeline + Bug Regressions | 10 | @api @smoke @regression |
| API Negative Paths | 8 | @api @ui @regression |
| Prompt Edge Cases | 10 | @api @security |
| Security Headers & Cookies | 8 | @api @security |
| Accessibility (axe-core) | 3 | @a11y @regression |
| Visual Regression | 2 | @visual |
| **Total unique tests** | **84** | |

## Browser Projects

| Project | Engine | Viewport |
|---------|--------|----------|
| chromium | Chromium | 1280x800 |
| firefox | Firefox | 1280x800 |
| webkit | WebKit (Safari) | 1280x800 |
| mobile-chrome | Chromium | 393x851 (Pixel 5) |

Run a specific browser: `npx playwright test --project=firefox`

### Docker

```bash
docker compose up          # run all tests via docker-compose
docker compose up --build  # rebuild and run

# or without compose:
docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.58.0-noble npx playwright test
```

For GitHub Actions, use the `mcr.microsoft.com/playwright` container or `npx playwright install --with-deps` in the workflow.
