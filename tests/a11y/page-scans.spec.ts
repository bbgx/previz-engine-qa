import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

function formatViolations(violations: AxeViolation[]) {
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
    .join('\n');
}

async function attachResults(results: Awaited<ReturnType<AxeBuilder['analyze']>>) {
  await test.info().attach('axe-results', {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json',
  });
}

test.describe('Accessibility — WCAG 2.1 AA Scans', () => {
  test('Studio page should have no a11y violations @a11y @regression', async ({ page }) => {
    test.fail(true, 'App has known a11y violations: missing button names, color contrast');
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await attachResults(results);
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, formatViolations(serious)).toEqual([]);
  });

  test('Stock Footage page should have no a11y violations @a11y @regression', async ({ page }) => {
    test.fail(true, 'App has known a11y violations: missing select names, button names');
    await page.goto('/stock-footage');
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await attachResults(results);
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, formatViolations(serious)).toEqual([]);
  });

  test('History page should have no a11y violations @a11y @regression', async ({ historyPage, page }) => {
    test.fail(true, 'App has known a11y violations: missing button names, color contrast');
    await historyPage.goto();
    await historyPage.switchToAllVideos();
    await historyPage.videoCountText.first().waitFor({ timeout: 10_000 });
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await attachResults(results);
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, formatViolations(serious)).toEqual([]);
  });
});
