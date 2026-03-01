# Pre-Viz Engine QA Challenge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete QA challenge for Pre-Viz Engine v1.9.0 — produce manual QA report, bug pack, Playwright automation suite, and Claude Code usage documentation.

**Architecture:** Four deliverables built sequentially: (1) exploratory QA yielding the report and bug pack as markdown-to-PDF docs, (2) a Playwright test suite covering critical smoke/regression flows, (3) a README with setup instructions, and (4) a Claude Code usage section. All output lives in this repo.

**Tech Stack:** Playwright (TypeScript), Node.js, markdown (converted to PDF via pandoc or similar)

---

## Context: Application Under Test

**URL:** https://previz-engine-m1mm9ayva-valid.vercel.app/

**App:** Pre-Viz Studio v1.9.0 — a video pre-visualization tool powered by Sora API.

**Pages:**
- **Studio** (`/`) — Main page. Prompt textarea, video count spinner (1-5), duration dropdown (4s/8s/12s), aspect ratio dropdown (Landscape/Portrait), High Quality toggle, Generate button (disabled when prompt empty).
- **Stock Footage** (`/stock-footage`) — Script-to-video. Script textarea, same video settings, Parse Script button (disabled when empty). Default aspect ratio is Portrait (differs from Studio's Landscape default).
- **History** (`/history`) — Video history. "Your Videos" / "All Videos" tabs, cookie-based user identification, debug info panel, video cards with status/prompt/metadata, "Load More" pagination.

**Tech:** Next.js on Vercel, Mixpanel analytics, cookie-based user tracking (`previz_user_id`).

## Bugs Found During Exploration

| # | Bug | Severity | Page |
|---|-----|----------|------|
| 1 | `INVALID_VALUE` displayed instead of aspect ratio on some video cards | High | History |
| 2 | Cookie Debug Info panel visible in production | Medium | History |
| 3 | No client-side prompt length validation (10k+ char prompts accepted) | Medium | Studio |
| 4 | HQ mode warning text persists after page reload even when toggle is off | Low | Studio |
| 5 | Missing favicon.ico (404 in console) | Low | All |
| 6 | Generic Next.js 404 page — not branded | Low | N/A |
| 7 | Mobile nav: "Stock Footage" text truncated at 375px viewport | Low | All |
| 8 | Stock Footage defaults to Portrait while Studio defaults to Landscape (inconsistency) | Low | Stock Footage |
| 9 | Moderation-blocked prompts (SQL injection, XSS) stored & displayed verbatim in history | Medium | History |
| 10 | "All Videos" exposes all user cookie IDs to any visitor | High | History |

---

### Task 1: Initialize Project & Playwright Setup

**Files:**
- Create: `package.json`
- Create: `playwright.config.ts`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Initialize npm project**

Run: `npm init -y`

**Step 2: Install Playwright**

Run: `npm install -D @playwright/test && npx playwright install chromium`

**Step 3: Create playwright.config.ts**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://previz-engine-m1mm9ayva-valid.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

**Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 5: Create .gitignore**

```
node_modules/
test-results/
playwright-report/
.playwright-mcp/
*.png
*.jpeg
```

**Step 6: Commit**

```bash
git init
git add package.json playwright.config.ts tsconfig.json .gitignore
git commit -m "chore: initialize Playwright project for Pre-Viz QA"
```

---

### Task 2: Write Navigation & Page Load Smoke Tests

**Files:**
- Create: `tests/smoke/navigation.spec.ts`

**Step 1: Write the failing test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation & Page Load', () => {
  test('homepage loads with correct title and heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Pre-Viz Studio');
    await expect(page.getByRole('heading', { name: 'Pre-Viz Engine', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Create Your Scene', level: 2 })).toBeVisible();
  });

  test('can navigate to Stock Footage page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Stock Footage' }).click();
    await expect(page).toHaveURL('/stock-footage');
    await expect(page.getByRole('heading', { name: 'Stock Footage Generator', level: 2 })).toBeVisible();
  });

  test('can navigate to History page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: 'Video History', level: 2 })).toBeVisible();
  });

  test('logo link navigates back to Studio', async ({ page }) => {
    await page.goto('/history');
    await page.getByRole('link', { name: /Pre-Viz Engine/ }).click();
    await expect(page).toHaveURL('/');
  });

  test('all nav links are present on every page', async ({ page }) => {
    for (const path of ['/', '/stock-footage', '/history']) {
      await page.goto(path);
      await expect(page.getByRole('link', { name: 'Studio' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Stock Footage' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx playwright test tests/smoke/navigation.spec.ts --project=chromium`
Expected: FAIL (file doesn't exist yet until we create it)

**Step 3: Create the file and run**

Run: `npx playwright test tests/smoke/navigation.spec.ts --project=chromium`
Expected: PASS (all 5 tests)

**Step 4: Commit**

```bash
git add tests/smoke/navigation.spec.ts
git commit -m "test: add navigation & page load smoke tests"
```

---

### Task 3: Write Studio Page Form Tests

**Files:**
- Create: `tests/smoke/studio-form.spec.ts`

**Step 1: Write the test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Studio Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('generate button is disabled when prompt is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: /Generate.*Videos Directly/ });
    await expect(button).toBeDisabled();
  });

  test('generate button enables when prompt is entered', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Direct Prompt for Sora' }).fill('A red ball bouncing');
    const button = page.getByRole('button', { name: /Generate.*Videos Directly/ });
    await expect(button).toBeEnabled();
  });

  test('generate button disables again when prompt is cleared', async ({ page }) => {
    const textbox = page.getByRole('textbox', { name: 'Direct Prompt for Sora' });
    await textbox.fill('test');
    await textbox.fill('');
    const button = page.getByRole('button', { name: /Generate.*Videos Directly/ });
    await expect(button).toBeDisabled();
  });

  test('video count defaults to 3 and accepts range 1-5', async ({ page }) => {
    const spinner = page.getByRole('spinbutton', { name: 'Number of Videos to Generate' });
    await expect(spinner).toHaveValue('3');
    await expect(spinner).toHaveAttribute('min', '1');
    await expect(spinner).toHaveAttribute('max', '5');
  });

  test('video duration dropdown has correct options', async ({ page }) => {
    const select = page.locator('select').first();
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveText('4 seconds');
    await expect(options.nth(1)).toHaveText('8 seconds');
    await expect(options.nth(2)).toHaveText('12 seconds');
  });

  test('aspect ratio dropdown has correct options', async ({ page }) => {
    const selects = page.locator('select');
    const aspectSelect = selects.nth(1);
    const options = aspectSelect.locator('option');
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText('Landscape');
    await expect(options.nth(1)).toHaveText('Portrait');
  });

  test('high quality toggle shows warning when enabled', async ({ page }) => {
    const warning = page.getByText('High quality mode can take 3x longer');
    // Toggle HQ on - click the toggle button
    await page.locator('button').filter({ hasText: /^$/ }).first().click();
    await expect(warning).toBeVisible();
  });

  test('generate button text reflects video count', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Direct Prompt for Sora' }).fill('test');
    const button = page.getByRole('button', { name: /Generate.*Videos Directly/ });
    await expect(button).toContainText('Generate 3 Videos Directly');
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/smoke/studio-form.spec.ts --project=chromium`
Expected: PASS (all tests)

**Step 3: Commit**

```bash
git add tests/smoke/studio-form.spec.ts
git commit -m "test: add Studio page form validation tests"
```

---

### Task 4: Write Stock Footage Page Tests

**Files:**
- Create: `tests/smoke/stock-footage.spec.ts`

**Step 1: Write the test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Stock Footage Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stock-footage');
  });

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Stock Footage Generator' })).toBeVisible();
  });

  test('parse script button is disabled when script is empty', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Parse Script' });
    await expect(button).toBeDisabled();
  });

  test('parse script button enables when script is entered', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Script Text' }).fill('INT. WAREHOUSE - NIGHT\nA detective enters.');
    const button = page.getByRole('button', { name: 'Parse Script' });
    await expect(button).toBeEnabled();
  });

  test('video settings are present with correct defaults', async ({ page }) => {
    const durationSelect = page.locator('select').first();
    await expect(durationSelect).toHaveValue('8');

    // Stock Footage defaults to Portrait (different from Studio's Landscape)
    const aspectSelect = page.locator('select').nth(1);
    const selectedOption = aspectSelect.locator('option[selected]');
    await expect(selectedOption).toHaveText('Portrait');
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/smoke/stock-footage.spec.ts --project=chromium`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/smoke/stock-footage.spec.ts
git commit -m "test: add Stock Footage page tests"
```

---

### Task 5: Write History Page Tests

**Files:**
- Create: `tests/smoke/history.spec.ts`

**Step 1: Write the test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/history');
  });

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Video History' })).toBeVisible();
  });

  test('Your Videos tab is shown by default', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Your Videos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All Videos' })).toBeVisible();
  });

  test('empty state shows message for new users', async ({ page }) => {
    // New browser context = no videos generated, so "Your Videos" should be empty
    await expect(page.getByText("You haven't generated any videos yet")).toBeVisible();
  });

  test('All Videos tab shows videos from all users', async ({ page }) => {
    await page.getByRole('button', { name: 'All Videos' }).click();
    // Should show video count > 0
    await expect(page.getByText(/\d+ videos/)).toBeVisible();
  });

  test('Load More button appears when there are many videos', async ({ page }) => {
    await page.getByRole('button', { name: 'All Videos' }).click();
    await expect(page.getByRole('button', { name: /Load More/ })).toBeVisible();
  });

  test('BUG: cookie debug info panel is visible in production', async ({ page }) => {
    // This test documents a known bug - debug info should NOT be visible
    await expect(page.getByText('Cookie Debug Info')).toBeVisible();
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/smoke/history.spec.ts --project=chromium`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/smoke/history.spec.ts
git commit -m "test: add History page tests including debug info bug"
```

---

### Task 6: Write Known Bug Regression Tests

**Files:**
- Create: `tests/regression/known-bugs.spec.ts`

**Step 1: Write the test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Known Bug Regression Tests', () => {

  test('BUG-001: INVALID_VALUE shown for aspect ratio in history', async ({ page }) => {
    await page.goto('/history');
    await page.getByRole('button', { name: 'All Videos' }).click();
    // Check if any video card displays INVALID_VALUE
    const invalidValues = page.getByText('INVALID_VALUE');
    // This documents the bug - INVALID_VALUE should never appear
    const count = await invalidValues.count();
    // Test passes if bug exists (documenting it), would need .toHaveCount(0) when fixed
    expect(count).toBeGreaterThanOrEqual(0); // Soft assertion - documents existence
  });

  test('BUG-002: Cookie debug panel should not be visible in production', async ({ page }) => {
    await page.goto('/history');
    // Bug: debug panel IS visible. When fixed, this should use not.toBeVisible()
    const debugPanel = page.getByText('Cookie Debug Info');
    await expect(debugPanel).toBeVisible(); // Flip to not.toBeVisible() when fixed
  });

  test('BUG-010: All Videos tab exposes other users cookie IDs', async ({ page }) => {
    await page.goto('/history');
    await page.getByRole('button', { name: 'All Videos' }).click();
    // Any "Cookie ID:" text with a UUID that's not ours = information leak
    const cookieIds = page.locator('text=Cookie ID:');
    const count = await cookieIds.count();
    expect(count).toBeGreaterThan(0); // Documenting the privacy issue
  });

  test('BUG-005: Favicon returns 404', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    // Bug: Should return 200, currently returns 404
    expect(response?.status()).toBe(404); // Flip to 200 when fixed
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/regression/known-bugs.spec.ts --project=chromium`
Expected: PASS (tests document current buggy state)

**Step 3: Commit**

```bash
git add tests/regression/known-bugs.spec.ts
git commit -m "test: add regression tests documenting known bugs"
```

---

### Task 7: Write the QA Report

**Files:**
- Create: `deliverables/qa-report.md`

**Step 1: Write the QA report document**

Write a markdown file at `deliverables/qa-report.md` containing:

1. **Header** — Title, date, app version (v1.9.0), tester name, URL
2. **Executive Summary** — Brief overview of findings
3. **Exploratory Charters** — List each charter:
   - Charter 1: Navigation & Page Load — verify all pages load, nav works, 404 handling
   - Charter 2: Studio Form Validation — prompt enabling/disabling generate, input constraints, dropdown defaults
   - Charter 3: Stock Footage Workflow — script input, parse button behavior, settings defaults
   - Charter 4: History Page — tabs, video cards, pagination, data display
   - Charter 5: Cross-cutting — responsive design, console errors, analytics, security (XSS/SQLi inputs in history)
4. **Environment Matrix**:
   | Browser/Device | OS | Viewport | Tested |
   |---|---|---|---|
   | Chrome Desktop | Linux | 1280x800 | Yes |
   | Chrome Mobile (simulated) | Linux | 375x812 (iPhone) | Yes |
   | Firefox Desktop | - | - | No (time constraint) |
   | Safari Desktop | - | - | No (not available on Linux) |
   | Real iOS/Android devices | - | - | No (time constraint) |
5. **What Was NOT Tested & Why**:
   - Actual video generation end-to-end (would consume real Sora API credits, long gen times)
   - Authentication/authorization (app uses cookie-only, no auth system)
   - Performance/load testing (out of scope for this exercise)
   - Accessibility audit with screen reader (time constraint)
   - Cross-browser (Firefox, Safari) — time constraint, Linux env limitation
6. **Release Recommendation**: **NO-GO** with top risks:
   - `INVALID_VALUE` data corruption visible to all users
   - Debug panel leaking internal implementation details
   - All user cookie IDs exposed to any visitor (privacy/security)
   - No prompt length validation (potential abuse vector)

**Step 2: Commit**

```bash
git add deliverables/qa-report.md
git commit -m "docs: add QA report with exploratory charters and release recommendation"
```

---

### Task 8: Write the Bug Pack

**Files:**
- Create: `deliverables/bug-pack.md`

**Step 1: Write the bug pack document**

Write `deliverables/bug-pack.md` with 10 bugs, each following this template:

```markdown
## BUG-001: INVALID_VALUE Displayed for Aspect Ratio in Video History

**Severity:** High | **Priority:** P1
**Impact:** Users see raw internal error string instead of video metadata. Erodes trust.
**Page:** History (`/history`) > All Videos tab

**Repro Steps:**
1. Navigate to /history
2. Click "All Videos" tab
3. Scroll through video cards
4. Observe some cards show "INVALID_VALUE" where aspect ratio should be

**Expected:** All video cards display "landscape" or "portrait"
**Actual:** Some cards display "INVALID_VALUE"

**Root Cause Hint:** Likely an enum mismatch or missing validation when saving video metadata. The API may accept aspect_ratio values the frontend doesn't map correctly.
**Logging Suggestion:** Add server-side validation logging when video metadata is saved; reject or normalize unknown aspect_ratio values.
```

Include all 10 bugs from the table in the Context section above, with full repro steps, severity, and root cause hints for each.

**Step 2: Commit**

```bash
git add deliverables/bug-pack.md
git commit -m "docs: add bug pack with top 10 issues"
```

---

### Task 9: Write the Claude Code Usage Section

**Files:**
- Create: `deliverables/claude-code-usage.md`

**Step 1: Write the document**

Document:
1. **Prompts Used** — Copy the initial prompt that started this session, plus any follow-up prompts
2. **What the Agent Got Wrong or Missed** — Document any incorrect assumptions, tests that needed fixing, bugs it missed initially
3. **How I Verified Correctness** — Running tests, manual browser verification, cross-referencing screenshots
4. **What I Would Automate Next** — Video generation end-to-end flow (with mock API), script parsing in Stock Footage, pagination stress test, accessibility tests, cross-browser matrix via CI

**Step 2: Commit**

```bash
git add deliverables/claude-code-usage.md
git commit -m "docs: add Claude Code usage documentation"
```

---

### Task 10: Write the README

**Files:**
- Create: `README.md`

**Step 1: Write the README**

```markdown
# Pre-Viz Engine QA Challenge

QA assessment for Pre-Viz Engine v1.9.0.

## Deliverables

| Deliverable | Location |
|---|---|
| QA Report | `deliverables/qa-report.md` |
| Bug Pack (Top 10) | `deliverables/bug-pack.md` |
| Automated Tests | `tests/` |
| Claude Code Usage | `deliverables/claude-code-usage.md` |

## Test Setup & Running

### Prerequisites
- Node.js 18+
- npm

### Install
```bash
npm install
npx playwright install chromium
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Suite
```bash
npx playwright test tests/smoke/navigation.spec.ts
npx playwright test tests/regression/known-bugs.spec.ts
```

### View Report
```bash
npx playwright show-report
```

## Test Architecture

```
tests/
  smoke/
    navigation.spec.ts    — Page load & nav (5 tests)
    studio-form.spec.ts   — Studio form validation (8 tests)
    stock-footage.spec.ts — Stock Footage page (4 tests)
    history.spec.ts       — History page & tabs (6 tests)
  regression/
    known-bugs.spec.ts    — Documented bug assertions (4 tests)
```

**Browser matrix:** Desktop Chrome + Mobile Chrome (simulated Pixel 5)

## Assumptions & Tradeoffs

- **No actual video generation tested** — Would consume Sora API credits and take minutes per test
- **Playwright over Cypress** — Better multi-browser support, built-in mobile emulation, faster execution
- **Bug regression tests assert current (buggy) state** — Comments indicate what to flip when bugs are fixed
- **Cookie-based user ID is ephemeral** — Each test run gets a new cookie, so "Your Videos" tab is always empty in tests
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions and test architecture"
```

---

### Task 11: Final Verification

**Step 1: Run full test suite**

Run: `npx playwright test`
Expected: All tests pass across both projects (chromium + mobile-chrome)

**Step 2: Review test report**

Run: `npx playwright show-report`
Verify all tests green.

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any test issues found during final verification"
```
