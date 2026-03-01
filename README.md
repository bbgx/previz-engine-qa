# Pre-Viz Engine v1.9.0 — QA Automation Suite

Playwright test suite for [Pre-Viz Engine](https://previz-engine-m1mm9ayva-valid.vercel.app/), an AI video generation tool powered by OpenAI's Sora API.

## Setup

```bash
pnpm install
npx playwright install chromium
```

## Running Tests

```bash
pnpm test                 # all tests
pnpm test:smoke           # smoke tests only
pnpm test:ui              # UI tests only
pnpm test:api             # API tests only
pnpm test:regression      # release-gate suite (core flows + bug validations)
pnpm report               # open HTML report
pnpm lint                 # ESLint
```

## Project Structure

```
tests/
  fixtures.ts             # Playwright custom fixtures (POM injection)
  data/
    fixtures.ts           # Test data (prompts, screenplays, endpoints)
    index.ts              # Barrel export
  pages/
    navigation.page.ts    # Navigation POM
    studio.page.ts        # Studio page POM (form, generation, mocking)
    stock-footage.page.ts # Stock Footage page POM (script parsing)
    history.page.ts       # History page POM (tabs, video cards)
    index.ts              # Barrel export
  ui/
    navigation.spec.ts    # Navigation smoke tests
    studio.spec.ts        # Studio form + generation trigger + BUG-009
    stock-footage.spec.ts # Script parsing flow tests
    history.spec.ts       # Video history + BUG-005
  api/
    generation-pipeline.spec.ts  # API contracts + BUG-001/002/003/006
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
| Studio Form | 8 | @smoke @ui |
| Studio Generation (mocked) | 2 | @smoke @ui |
| Studio Bug Regression | 1 | @regression @ui |
| Stock Footage Form | 3 | @smoke @ui |
| Stock Footage Parsing | 5 | @ui |
| History | 8 | @smoke @ui |
| History Bug Regression | 1 | @regression @ui |
| API Pipeline | 6 | @api @smoke |
| API Bug Regressions | 4 | @api @regression |
| **Total** | **42** | |
